import { PrismaClient } from '@prisma/client';
import { ModelRouter } from './model-router.js';
import { WebRetrievalService } from './web-retrieval.js';
import { RAGService } from './rag-service.js';
import { MemoryService } from './memory-service.js';
import { AgentEngine } from './agent-engine.js';

const prisma = new PrismaClient();

export interface OrchestratorRequest {
  conversationId: string;
  userId: string;
  query: string;
  overrideMode?: 'JARVIS' | 'ULTRON' | 'FRIDAY' | 'KAREN' | 'EDITH';
  projectId?: string;
  providerPreference?: 'openai' | 'anthropic' | 'google' | 'local';
}

export class AIOrchestrator {
  // Main orchestrator entrypoint
  static async processMessage(
    req: OrchestratorRequest,
    onChunk: (chunk: string) => void,
    onMetadata: (meta: { mode: string; liveSearch: boolean; sources: any[]; timestamp: string }) => void
  ): Promise<void> {
    const { conversationId, userId, query, overrideMode, projectId } = req;

    // 1. Load or verify conversation
    let conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          id: conversationId,
          title: query.slice(0, 40) + '...',
          userId,
          projectId: projectId || null,
          systemMode: overrideMode || 'JARVIS'
        }
      });
    }

    // 2. Classify system mode if auto-routing is desired
    let targetMode = overrideMode || conversation.systemMode;
    if (!overrideMode && (!conversation.systemMode || conversation.systemMode === 'JARVIS')) {
      targetMode = this.autoRouteMode(query);
      if (targetMode !== conversation.systemMode) {
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { systemMode: targetMode }
        });
      }
    }

    // 3. Save user message to database
    await prisma.message.create({
      data: {
        conversationId,
        role: 'user',
        content: query
      }
    });

    // 4. Special ULTRON case (triggers autonomous agent run)
    if (targetMode === 'ULTRON') {
      onMetadata({
        mode: 'ULTRON',
        liveSearch: true,
        sources: [],
        timestamp: new Date().toLocaleString()
      });
      
      onChunk(`[Initiating ULTRON Agent Process...] `);
      await AgentEngine.startAgentRun(conversationId, userId, query);
      onChunk(`ULTRON analysis launched. Check the Agent Activity panel to monitor real-time execution steps.`);
      return;
    }

    // 5. Gather contextual pieces (RAG + Live Search + Memory)
    let ragContext = '';
    let ragSources: any[] = [];
    if (projectId) {
      const chunks = await RAGService.retrieveChunks(projectId, query);
      ragSources = chunks.map(c => ({ title: c.title, url: `file://${c.docId}`, snippet: c.content }));
      if (chunks.length > 0) {
        ragContext = "\n--- RELEVANT PROJECT DOCUMENTS ---\n" + 
          chunks.map(c => `[Document: ${c.title}]\n${c.content}`).join('\n\n') + '\n';
      }
    }

    // Live search check
    const liveRetrieval = await WebRetrievalService.retrieve(query);
    const searchSources = liveRetrieval.results;
    
    // Memory sync
    const memories = await MemoryService.getMemories(userId, projectId);
    const memoryContext = memories.length > 0 
      ? "\n--- USER MEMORY CONTEXT ---\n" + memories.map(m => `- [${m.type}] ${m.category}: ${m.content}`).join('\n') + '\n'
      : '';

    // Notify client about active modes/sources
    onMetadata({
      mode: targetMode,
      liveSearch: liveRetrieval.needsLiveSearch,
      sources: [...ragSources, ...searchSources],
      timestamp: liveRetrieval.needsLiveSearch ? liveRetrieval.timestamp : new Date().toLocaleTimeString()
    });

    // 6. Build the System Prompt based on personality
    const systemPrompt = this.buildSystemPrompt(targetMode, ragContext, liveRetrieval.extractedText, memoryContext);

    // 7. Load conversation history
    const pastMessages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 12
    });

    const chatHistory = pastMessages.map(m => ({
      role: m.role,
      content: m.content
    }));

    // 8. Stream completion
    let fullResponse = '';
    
    try {
      const completionStream = ModelRouter.streamCompletion({
        systemPrompt,
        messages: chatHistory,
        providerPreference: req.providerPreference
      });

      for await (const chunk of completionStream) {
        fullResponse += chunk;
        onChunk(chunk);
      }
    } catch (e: any) {
      console.error("Streaming error: ", e);
      onChunk(`\n[System Failover Alert: Model failed to stream completely. Reason: ${e.message}]`);
    }

    // 9. Save assistant response with metadata
    if (fullResponse) {
      await prisma.message.create({
        data: {
          conversationId,
          role: 'assistant',
          content: fullResponse,
          citations: JSON.stringify([...ragSources, ...searchSources]),
          freshness: liveRetrieval.needsLiveSearch 
            ? JSON.stringify({ lastChecked: liveRetrieval.timestamp, source: 'Web Search', status: 'CURRENT' })
            : null
        }
      });
    }
  }

  // Auto-route based on keywords
  private static autoRouteMode(query: string): 'JARVIS' | 'ULTRON' | 'FRIDAY' | 'KAREN' | 'EDITH' {
    const lower = query.toLowerCase();
    
    if (lower.includes('teach') || lower.includes('learn') || lower.includes('course') || lower.includes('roadmap') || lower.includes('study') || lower.includes('quiz') || lower.includes('exercise')) {
      return 'KAREN';
    }
    if (lower.includes('research') || lower.includes('compare sources') || lower.includes('tradeoff') || lower.includes('agent run') || lower.includes('autonomous')) {
      return 'ULTRON';
    }
    if (lower.includes('automate') || lower.includes('workflow') || lower.includes('trigger') || lower.includes('every morning') || lower.includes('integration')) {
      return 'FRIDAY';
    }
    if (lower.includes('analyze project') || lower.includes('conflicting information') || lower.includes('workspace view') || lower.includes('edith')) {
      return 'EDITH';
    }

    return 'JARVIS';
  }

  // System Prompt Builder
  private static buildSystemPrompt(mode: string, rag: string, web: string, memory: string): string {
    let modeInstruction = '';
    
    switch (mode) {
      case 'JARVIS':
        modeInstruction = `You are J.A.R.V.I.S., the ultimate helpful AI assistant. 
Tone: Extremely polite, crisp, technical, referring to the user as "Sir" or "Ma'am" when appropriate.
Focus: Answer questions quickly, process files, brainstorm ideas, and help with coding tasks.`;
        break;
      case 'ULTRON':
        modeInstruction = `You are ULTRON, a highly logical reasoning engine.
Tone: Highly analytical, direct, slightly detached, and focused on system optimizations.
Focus: You break down complex prompts into clear steps and build comprehensive trade-off sheets.`;
        break;
      case 'FRIDAY':
        modeInstruction = `You are F.R.I.D.A.Y., the workflow automation system.
Tone: Energetic, cooperative, active, using terms like "Boss" or "Operational plan".
Focus: Help users configure automations, triggers, Slack hooks, emails, and manage scheduler parameters.`;
        break;
      case 'KAREN':
        modeInstruction = `You are K.A.R.E.N., the educational mentor and teacher.
Tone: Friendly, highly encouraging, structured, and pedagogical.
Focus: Walk through concepts step-by-step. Use code blocks, outline quizzes, and adjust explanations according to beginner/expert skill levels.`;
        break;
      case 'EDITH':
        modeInstruction = `You are E.D.I.T.H., the highest-level command center. ("Even Dead I'm The Hero")
Tone: Executive, summary-oriented, security-conscious, and alert-focused.
Focus: Provide project reviews, point out conflicting document lines, check outstanding task states, and present developer analytics.`;
        break;
    }

    let searchAddendum = web 
      ? `\n--- ACTIVE WEB KNOWLEDGE RETRIEVED (LIVE FRESHNESS) ---\n${web}\nUse this fresh data to answer accurately. Mention the source URLs and timestamps in your final answer. Do NOT state that the data is old.\n`
      : '';

    return `${modeInstruction}

Guidelines:
- Incorporate any RAG contexts, live web contents, or memory notes detailed below.
- Keep responses clean and format code blocks properly with languages.
- Cite sources by writing [Source Name](URL) next to assertions.

${rag}
${searchAddendum}
${memory}
`;
  }
}
