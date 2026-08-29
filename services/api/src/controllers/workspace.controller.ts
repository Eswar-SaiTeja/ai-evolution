import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { RAGService } from '../services/rag-service.js';
import { MemoryService } from '../services/memory-service.js';
import { AutomationService } from '../services/automation-service.js';
import { LearningMentorService } from '../services/learning-mentor.js';

const prisma = new PrismaClient();

// PROJECTS
export const getProjects = async (req: any, res: Response): Promise<void> => {
  try {
    const list = await prisma.project.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createProject = async (req: any, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;
    const project = await prisma.project.create({
      data: {
        name,
        description,
        userId: req.user.userId
      }
    });
    res.status(201).json(project);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// DOCUMENTS / RAG
export const uploadDocument = async (req: any, res: Response): Promise<void> => {
  try {
    const { title, fileType, content, projectId, fileSize } = req.body;

    if (!title || !fileType || content === undefined) {
      res.status(400).json({ error: 'Missing title, fileType, or content' });
      return;
    }

    // 1. Create document entry
    const doc = await prisma.document.create({
      data: {
        title,
        fileType,
        fileSize: fileSize || content.length,
        userId: req.user.userId,
        projectId: projectId || null,
        indexingStatus: 'PENDING'
      }
    });

    // 2. Trigger asynchronous RAG vectorization
    // Since it hashes words in pure JS, it is fast and safe
    RAGService.indexDocument(doc.id, content);

    res.status(201).json({
      message: 'Document uploaded. Indexing has started in the background.',
      document: doc
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getDocuments = async (req: any, res: Response): Promise<void> => {
  try {
    const { projectId } = req.query;
    const list = await prisma.document.findMany({
      where: {
        userId: req.user.userId,
        projectId: projectId || null
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteDocument = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.document.delete({
      where: { id, userId: req.user.userId }
    });
    res.json({ message: 'Document deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// MEMORY SYSTEM
export const getMemories = async (req: any, res: Response): Promise<void> => {
  try {
    const { projectId } = req.query;
    const memories = await MemoryService.getMemories(req.user.userId, projectId);
    res.json(memories);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const addMemory = async (req: any, res: Response): Promise<void> => {
  try {
    const { type, category, content, projectId } = req.body;
    const memory = await MemoryService.addMemory(req.user.userId, type, category, content, projectId);
    res.status(201).json(memory);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteMemory = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await MemoryService.deleteMemory(id);
    res.json({ message: 'Memory deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const clearMemories = async (req: any, res: Response): Promise<void> => {
  try {
    await MemoryService.clearAllMemories(req.user.userId);
    res.json({ message: 'All memories cleared' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// AUTOMATIONS (F.R.I.D.A.Y.)
export const getAutomations = async (req: any, res: Response): Promise<void> => {
  try {
    const list = await AutomationService.getAutomations(req.user.userId);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createAutomation = async (req: any, res: Response): Promise<void> => {
  try {
    const automation = await AutomationService.createAutomation(req.user.userId, req.body);
    res.status(201).json(automation);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateAutomation = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updated = await AutomationService.updateAutomation(id, req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteAutomation = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await AutomationService.deleteAutomation(id);
    res.json({ message: 'Automation deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const runAutomation = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const run = await AutomationService.triggerRun(id);
    res.json(run);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// COURSES (K.A.R.E.N.)
export const getCourses = async (req: any, res: Response): Promise<void> => {
  try {
    const list = await prisma.learningCourse.findMany({
      where: { userId: req.user.userId },
      include: { progress: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(list.map(c => ({
      ...c,
      roadmap: JSON.parse(c.roadmap)
    })));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createCourse = async (req: any, res: Response): Promise<void> => {
  try {
    const { title, level } = req.body;
    const course = await LearningMentorService.createCourse(req.user.userId, title, level);
    res.status(201).json(course);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const submitQuiz = async (req: any, res: Response): Promise<void> => {
  try {
    const { progressId, score } = req.body;
    const progress = await LearningMentorService.submitQuizScore(progressId, score);
    res.json(progress);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
