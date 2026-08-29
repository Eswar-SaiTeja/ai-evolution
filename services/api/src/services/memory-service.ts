import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class MemoryService {
  static async addMemory(userId: string, type: 'SHORT' | 'LONG' | 'PROJECT' | 'EPISODIC', category: string, content: string, projectId?: string) {
    return prisma.memory.create({
      data: {
        userId,
        projectId: projectId || null,
        type,
        category,
        content
      }
    });
  }

  static async getMemories(userId: string, projectId?: string) {
    return prisma.memory.findMany({
      where: {
        userId,
        OR: [
          { projectId: projectId || null },
          { projectId: null }
        ]
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  static async updateMemory(id: string, content: string) {
    return prisma.memory.update({
      where: { id },
      data: { content }
    });
  }

  static async deleteMemory(id: string) {
    return prisma.memory.delete({
      where: { id }
    });
  }

  static async clearAllMemories(userId: string) {
    return prisma.memory.deleteMany({
      where: { userId }
    });
  }
}
