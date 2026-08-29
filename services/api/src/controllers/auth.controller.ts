import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

const prisma = new PrismaClient();

// Hash password with standard Node.js pbkdf2
function hashPassword(password: string): string {
  const salt = 'ai-evolution-salt-2026';
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512');
  return hash.toString('hex');
}

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      res.status(400).json({ error: 'Missing email, password, or name' });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ error: 'User with this email already exists' });
      return;
    }

    const passwordHash = hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: 'USER'
      }
    });

    // Create a default project for the new user
    const defaultProject = await prisma.project.create({
      data: {
        name: 'My Workspace',
        description: 'Primary AI EVOLUTION project environment',
        userId: user.id
      }
    });

    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, config.jwtSecret, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      defaultProjectId: defaultProject.id
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Missing email or password' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(400).json({ error: 'Invalid credentials' });
      return;
    }

    const hash = hashPassword(password);
    if (user.passwordHash !== hash) {
      res.status(400).json({ error: 'Invalid credentials' });
      return;
    }

    // Get default project or create one if missing
    let project = await prisma.project.findFirst({ where: { userId: user.id } });
    if (!project) {
      project = await prisma.project.create({
        data: {
          name: 'My Workspace',
          description: 'Primary AI EVOLUTION project environment',
          userId: user.id
        }
      });
    }

    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, config.jwtSecret, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      defaultProjectId: project.id
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getMe = async (req: any, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const project = await prisma.project.findFirst({ where: { userId: user.id } });

    res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      defaultProjectId: project?.id || null
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
