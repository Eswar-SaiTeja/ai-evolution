import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AIOrchestrator } from '../services/ai-orchestrator.js';

const prisma = new PrismaClient();

export const getConversations = async (req: any, res: Response): Promise<void> => {
  try {
    const { projectId } = req.query;
    const list = await prisma.conversation.findMany({
      where: {
        userId: req.user.userId,
        projectId: projectId || null
      },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createConversation = async (req: any, res: Response): Promise<void> => {
  try {
    const { title, systemMode, projectId } = req.body;
    const conversation = await prisma.conversation.create({
      data: {
        title: title || 'New Conversation',
        systemMode: systemMode || 'JARVIS',
        userId: req.user.userId,
        projectId: projectId || null
      }
    });
    res.status(201).json(conversation);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteConversation = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.conversation.delete({
      where: { id, userId: req.user.userId }
    });
    res.json({ message: 'Conversation deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getMessages = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const messages = await prisma.message.findMany({
      where: {
        conversationId: id,
        conversation: { userId: req.user.userId }
      },
      orderBy: { createdAt: 'asc' }
    });

    const formatted = messages.map(m => ({
      ...m,
      citations: m.citations ? JSON.parse(m.citations) : [],
      freshness: m.freshness ? JSON.parse(m.freshness) : null
    }));

    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// SSE streaming endpoint
export const streamMessage = async (req: any, res: Response): Promise<void> => {
  const { conversationId, query, overrideMode, projectId, providerPreference } = req.body;
  const userId = req.user.userId;

  if (!conversationId || !query) {
    res.status(400).json({ error: 'Missing conversationId or query' });
    return;
  }

  // Setup Server-Sent Events headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no' // disable proxy buffering
  });

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    await AIOrchestrator.processMessage(
      {
        conversationId,
        userId,
        query,
        overrideMode,
        projectId,
        providerPreference
      },
      (chunk) => {
        sendEvent('chunk', { chunk });
      },
      (metadata) => {
        sendEvent('metadata', metadata);
      }
    );

    sendEvent('done', { message: 'Stream completed' });
  } catch (error: any) {
    console.error("SSE stream error:", error);
    sendEvent('error', { error: error.message || 'Stream processing failed' });
  } finally {
    res.end();
  }
};

// Fetch active agent execution status for ULTRON HUD visualizer
export const getAgentRunStatus = async (req: any, res: Response): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const run = await prisma.agentRun.findFirst({
      where: {
        conversationId,
        conversation: { userId: req.user.userId }
      },
      include: { tasks: { orderBy: { orderIndex: 'asc' } } },
      orderBy: { createdAt: 'desc' }
    });

    if (!run) {
      res.status(404).json({ error: 'No agent runs active' });
      return;
    }

    res.json({
      id: run.id,
      objective: run.objective,
      status: run.status,
      steps: JSON.parse(run.steps),
      tasks: run.tasks,
      createdAt: run.createdAt
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
