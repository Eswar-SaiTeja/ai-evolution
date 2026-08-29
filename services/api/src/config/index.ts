import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 5000,
  jwtSecret: process.env.JWT_SECRET || 'ai-evolution-super-secret-key-2026',
  providers: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      fallbackModel: 'gpt-4o-mini',
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest',
      fallbackModel: 'claude-3-haiku-20240307',
    },
    google: {
      apiKey: process.env.GEMINI_API_KEY || '',
      model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
      fallbackModel: 'gemini-1.5-flash',
    },
    local: {
      endpoint: process.env.LOCAL_MODEL_ENDPOINT || 'http://localhost:11434/api/generate',
      model: process.env.LOCAL_MODEL_NAME || 'llama3',
    }
  },
  defaultSystemModes: {
    JARVIS: 'JARVIS',
    ULTRON: 'ULTRON',
    FRIDAY: 'FRIDAY',
    KAREN: 'KAREN',
    EDITH: 'EDITH'
  }
};
