import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { authMiddleware } from './middleware/auth.js';

// Import controllers
import * as authController from './controllers/auth.controller.js';
import * as chatController from './controllers/chat.controller.js';
import * as workspaceController from './controllers/workspace.controller.js';
import * as adminController from './controllers/admin.controller.js';

const app = express();

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for local cross-platform development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' })); // Support larger text inputs/documents

// Public routes
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'UP', service: 'AI EVOLUTION API Gateway', timestamp: new Date().toISOString() });
});

// Authenticated routes
app.get('/api/auth/me', authMiddleware, authController.getMe);

// Chat & Stream
app.get('/api/chat/conversations', authMiddleware, chatController.getConversations);
app.post('/api/chat/conversations', authMiddleware, chatController.createConversation);
app.delete('/api/chat/conversations/:id', authMiddleware, chatController.deleteConversation);
app.get('/api/chat/messages/:id', authMiddleware, chatController.getMessages);
app.post('/api/chat/stream', authMiddleware, chatController.streamMessage);
app.get('/api/chat/agent-run/:conversationId', authMiddleware, chatController.getAgentRunStatus);

// Workspace Projects
app.get('/api/workspace/projects', authMiddleware, workspaceController.getProjects);
app.post('/api/workspace/projects', authMiddleware, workspaceController.createProject);

// Workspace Documents / RAG
app.get('/api/workspace/documents', authMiddleware, workspaceController.getDocuments);
app.post('/api/workspace/documents', authMiddleware, workspaceController.uploadDocument);
app.delete('/api/workspace/documents/:id', authMiddleware, workspaceController.deleteDocument);

// Workspace Memory
app.get('/api/workspace/memories', authMiddleware, workspaceController.getMemories);
app.post('/api/workspace/memories', authMiddleware, workspaceController.addMemory);
app.delete('/api/workspace/memories/:id', authMiddleware, workspaceController.deleteMemory);
app.delete('/api/workspace/memories', authMiddleware, workspaceController.clearMemories);

// Workspace Automations
app.get('/api/workspace/automations', authMiddleware, workspaceController.getAutomations);
app.post('/api/workspace/automations', authMiddleware, workspaceController.createAutomation);
app.put('/api/workspace/automations/:id', authMiddleware, workspaceController.updateAutomation);
app.delete('/api/workspace/automations/:id', authMiddleware, workspaceController.deleteAutomation);
app.post('/api/workspace/automations/:id/run', authMiddleware, workspaceController.runAutomation);

// Workspace Learning (K.A.R.E.N.)
app.get('/api/workspace/courses', authMiddleware, workspaceController.getCourses);
app.post('/api/workspace/courses', authMiddleware, workspaceController.createCourse);
app.post('/api/workspace/courses/quiz', authMiddleware, workspaceController.submitQuiz);

// E.D.I.T.H. Insights
app.get('/api/workspace/insights', authMiddleware, adminController.getWorkspaceInsights);

// Admin / Observability
app.get('/api/admin/status', authMiddleware, adminController.getSystemStatus);
app.get('/api/admin/models', authMiddleware, adminController.getModelConfigs);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// Boot
app.listen(config.port, '0.0.0.0', () => {
  console.log(`========================================`);
  console.log(`  AI EVOLUTION API SERVER STARTED`);
  console.log(`  Port: ${config.port}`);
  console.log(`  Environment: Development/Production`);
  console.log(`========================================`);
});
