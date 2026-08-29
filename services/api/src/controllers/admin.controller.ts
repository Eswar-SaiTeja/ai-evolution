import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ModelRouter } from '../services/model-router.js';
import { ProjectInsightsService } from '../services/project-insights.js';

const prisma = new PrismaClient();

export const getSystemStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const health = await ModelRouter.checkHealth();
    
    // Check db connectivity
    let dbStatus = 'ONLINE';
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (e) {
      dbStatus = 'OFFLINE';
    }

    // Counts for stats
    const usersCount = await prisma.user.count();
    const conversationsCount = await prisma.conversation.count();
    const documentsCount = await prisma.document.count();

    res.json({
      status: 'ONLINE',
      database: dbStatus,
      models: health,
      metrics: {
        users: usersCount,
        conversations: conversationsCount,
        documents: documentsCount
      },
      timestamp: new Date().toLocaleString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getWorkspaceInsights = async (req: any, res: Response): Promise<void> => {
  try {
    const { projectId } = req.query;

    if (!projectId) {
      res.status(400).json({ error: 'Missing projectId' });
      return;
    }

    const insightsData = await ProjectInsightsService.generateInsights(projectId);
    res.json(insightsData);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getModelConfigs = async (req: Request, res: Response): Promise<void> => {
  try {
    // Return standard configurations
    res.json([
      { model: 'gemini-1.5-pro', provider: 'google', contextLimit: '1M tokens', status: 'ONLINE', isDefault: true },
      { model: 'gpt-4o', provider: 'openai', contextLimit: '128K tokens', status: 'ONLINE', isDefault: false },
      { model: 'claude-3-5-sonnet-latest', provider: 'anthropic', contextLimit: '200K tokens', status: 'ONLINE', isDefault: false },
      { model: 'llama3 (local)', provider: 'local', contextLimit: '8K tokens', status: 'ONLINE', isDefault: false }
    ]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
