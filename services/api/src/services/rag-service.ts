import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class RAGService {
  // Simple paragraph-based text chunker
  static chunkText(text: string, chunkSize = 500, overlap = 100): string[] {
    const paragraphs = text.split(/\n+/);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const paragraph of paragraphs) {
      if ((currentChunk + '\n' + paragraph).length <= chunkSize) {
        currentChunk += (currentChunk ? '\n' : '') + paragraph;
      } else {
        if (currentChunk) chunks.push(currentChunk);
        // Overlap logic
        currentChunk = paragraph.slice(-overlap) + paragraph;
      }
    }
    if (currentChunk) {
      chunks.push(currentChunk);
    }
    return chunks.filter(c => c.trim().length > 0);
  }

  // Create a normalized dense vector (384 dimensions) using a term-hashing method (a stable, zero-dependency TF-IDF equivalent)
  static generateEmbedding(text: string): number[] {
    const dimensions = 384;
    const vector = new Array(dimensions).fill(0);
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2);

    if (words.length === 0) {
      return vector;
    }

    // Hash words into dimensions using FNV-1a hash
    for (const word of words) {
      let hash = 2166136261;
      for (let i = 0; i < word.length; i++) {
        hash ^= word.charCodeAt(i);
        hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
      }
      const index = Math.abs(hash) % dimensions;
      vector[index] += 1;
    }

    // L2 Normalize the vector to unit length
    let sumOfSquares = 0;
    for (let i = 0; i < dimensions; i++) {
      sumOfSquares += vector[i] * vector[i];
    }
    
    const magnitude = Math.sqrt(sumOfSquares);
    if (magnitude > 0) {
      for (let i = 0; i < dimensions; i++) {
        vector[i] = vector[i] / magnitude;
      }
    }

    return vector;
  }

  // Cosine Similarity between two numeric vectors
  static cosineSimilarity(v1: number[], v2: number[]): number {
    if (v1.length !== v2.length) return 0;
    let dotProduct = 0;
    for (let i = 0; i < v1.length; i++) {
      dotProduct += v1[i] * v2[i];
    }
    return dotProduct; // Already normalized
  }

  // Index Document content into SQLite Database
  static async indexDocument(documentId: string, content: string): Promise<void> {
    try {
      const chunks = this.chunkText(content);
      
      // Delete old chunks first
      await prisma.documentChunk.deleteMany({
        where: { documentId }
      });

      // Insert new chunks
      for (let i = 0; i < chunks.length; i++) {
        const chunkText = chunks[i];
        const embedding = this.generateEmbedding(chunkText);

        await prisma.documentChunk.create({
          data: {
            documentId,
            content: chunkText,
            embedding: JSON.stringify(embedding),
            orderIndex: i
          }
        });
      }

      await prisma.document.update({
        where: { id: documentId },
        data: { indexingStatus: 'INDEXED' }
      });
    } catch (e) {
      console.error(`RAG Indexing error for document ${documentId}:`, e);
      await prisma.document.update({
        where: { id: documentId },
        data: { indexingStatus: 'FAILED' }
      });
    }
  }

  // Retrieve relevant chunks matching query from the specified project scope
  static async retrieveChunks(projectId: string, query: string, limit = 4): Promise<{ content: string; title: string; docId: string; similarity: number }[]> {
    const queryVector = this.generateEmbedding(query);

    // Load all chunks belonging to documents in the project
    const allChunks = await prisma.documentChunk.findMany({
      where: {
        document: {
          projectId: projectId
        }
      },
      include: {
        document: true
      }
    });

    const matches = allChunks.map(chunk => {
      let chunkVector: number[];
      try {
        chunkVector = JSON.parse(chunk.embedding);
      } catch (e) {
        chunkVector = new Array(384).fill(0);
      }

      const similarity = this.cosineSimilarity(queryVector, chunkVector);
      return {
        content: chunk.content,
        title: chunk.document.title,
        docId: chunk.document.id,
        similarity
      };
    });

    // Sort by similarity descending
    return matches
      .filter(m => m.similarity > 0.05) // similarity threshold
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }
}
