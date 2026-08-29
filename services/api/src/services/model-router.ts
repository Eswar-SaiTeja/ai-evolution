import { config } from '../config/index.js';

export interface CompletionRequest {
  systemPrompt: string;
  messages: { role: string; content: string }[];
  providerPreference?: 'openai' | 'anthropic' | 'google' | 'local';
  temperature?: number;
}

export interface ModelHealth {
  provider: string;
  model: string;
  status: 'ONLINE' | 'OFFLINE' | 'DEGRADED';
  latencyMs: number;
}

export class ModelRouter {
  // Check health of configured providers
  static async checkHealth(): Promise<ModelHealth[]> {
    const providers = ['openai', 'anthropic', 'google', 'local'];
    const results: ModelHealth[] = [];

    for (const provider of providers) {
      const start = Date.now();
      let status: 'ONLINE' | 'OFFLINE' | 'DEGRADED' = 'OFFLINE';
      
      try {
        if (provider === 'openai' && config.providers.openai.apiKey) {
          status = 'ONLINE';
        } else if (provider === 'anthropic' && config.providers.anthropic.apiKey) {
          status = 'ONLINE';
        } else if (provider === 'google' && config.providers.google.apiKey) {
          status = 'ONLINE';
        } else if (provider === 'local') {
          // Check local endpoint with fetch
          const controller = new AbortController();
          const id = setTimeout(() => controller.abort(), 1000);
          const res = await fetch(config.providers.local.endpoint, {
            method: 'HEAD',
            signal: controller.signal
          }).catch(() => null);
          clearTimeout(id);
          status = res && res.ok ? 'ONLINE' : 'OFFLINE';
        }
      } catch (e) {
        status = 'OFFLINE';
      }

      results.push({
        provider,
        model: provider === 'local' ? config.providers.local.model : (config.providers as any)[provider]?.model || 'default',
        status,
        latencyMs: Date.now() - start
      });
    }

    return results;
  }

  // Stream completion generator
  static async *streamCompletion(req: CompletionRequest): AsyncGenerator<string, void, unknown> {
    const provider = req.providerPreference || this.determineProvider(req);
    
    try {
      if (provider === 'openai' && config.providers.openai.apiKey) {
        yield* this.streamOpenAI(req);
      } else if (provider === 'anthropic' && config.providers.anthropic.apiKey) {
        yield* this.streamAnthropic(req);
      } else if (provider === 'google' && config.providers.google.apiKey) {
        yield* this.streamGoogle(req);
      } else {
        // Fallback to local / simulation generator
        yield* this.streamMock(req);
      }
    } catch (error) {
      console.warn(`Provider ${provider} failed. Routing to fallback...`, error);
      // Fallback pathway
      try {
        yield* this.streamMock(req, `[System Alert: Fallback triggered due to API issue] `);
      } catch (fallbackError) {
        yield `Error routing completion: ${String(fallbackError)}`;
      }
    }
  }

  private static determineProvider(req: CompletionRequest): 'openai' | 'anthropic' | 'google' | 'local' {
    // Select based on context or preference; default to google/openai if API keys available, otherwise local
    if (config.providers.google.apiKey) return 'google';
    if (config.providers.openai.apiKey) return 'openai';
    if (config.providers.anthropic.apiKey) return 'anthropic';
    return 'local';
  }

  private static async *streamOpenAI(req: CompletionRequest): AsyncGenerator<string, void, unknown> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.providers.openai.apiKey}`
      },
      body: JSON.stringify({
        model: config.providers.openai.model,
        messages: [
          { role: 'system', content: req.systemPrompt },
          ...req.messages
        ],
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI error: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const cleaned = line.replace(/^data: /, '').trim();
        if (cleaned === '[DONE]') continue;
        if (!cleaned) continue;

        try {
          const parsed = JSON.parse(cleaned);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) yield content;
        } catch (e) {
          // Ignore parse errors for incomplete JSON lines
        }
      }
    }
  }

  private static async *streamAnthropic(req: CompletionRequest): AsyncGenerator<string, void, unknown> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.providers.anthropic.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: config.providers.anthropic.model,
        system: req.systemPrompt,
        messages: req.messages,
        max_tokens: 4000,
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic error: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const cleaned = line.slice(5).trim();
        try {
          const parsed = JSON.parse(cleaned);
          if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
            yield parsed.delta.text;
          }
        } catch (e) {
          // Ignore
        }
      }
    }
  }

  private static async *streamGoogle(req: CompletionRequest): AsyncGenerator<string, void, unknown> {
    const apiKey = config.providers.google.apiKey;
    const model = config.providers.google.model;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}`;

    const formattedContents = req.messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    // Add system instruction if provided
    const body: any = {
      contents: formattedContents
    };
    if (req.systemPrompt) {
      body.systemInstruction = {
        parts: [{ text: req.systemPrompt }]
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Google Gemini API error: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      // Gemini streams JSON chunks wrapped in brackets or separated by commas
      // For simplicity, we can do a regex match for text outputs in the buffer
      let match;
      const textRegex = /"text"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
      
      // We will parse line-by-line of JSON arrays if possible
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        try {
          // Google stream generates blocks of JSON
          // Example: {"candidates": [{"content": {"parts": [{"text": "hello"}]}}]}
          const cleaned = line.trim().replace(/^,/, '').replace(/^\[/, '').replace(/\]$/, '');
          if (!cleaned) continue;
          const parsed = JSON.parse(cleaned);
          const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            yield text;
          }
        } catch (e) {
          // If JSON parse fails, attempt regex extraction on the line
          while ((match = textRegex.exec(line)) !== null) {
            const escapedText = match[1];
            // Simple unescape
            const unescaped = escapedText
              .replace(/\\n/g, '\n')
              .replace(/\\t/g, '\t')
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, '\\');
            yield unescaped;
          }
        }
      }
    }
  }

  // Pure TypeScript local mock generator that mimics each model's personality
  private static async *streamMock(req: CompletionRequest, prefix = ''): AsyncGenerator<string, void, unknown> {
    if (prefix) {
      yield prefix;
    }

    const userPrompt = req.messages[req.messages.length - 1]?.content || '';
    const isJarvis = req.systemPrompt.includes('JARVIS') || req.systemPrompt.includes('J.A.R.V.I.S.');
    const isUltron = req.systemPrompt.includes('ULTRON');
    const isFriday = req.systemPrompt.includes('FRIDAY') || req.systemPrompt.includes('F.R.I.D.A.Y.');
    const isKaren = req.systemPrompt.includes('KAREN') || req.systemPrompt.includes('K.A.R.E.N.');
    const isEdith = req.systemPrompt.includes('EDITH') || req.systemPrompt.includes('E.D.I.T.H.');

    let textResponse = '';

    if (isJarvis) {
      textResponse = `At your service, Sir. I have processed your request concerning "${userPrompt}". 

Analyzing current parameters, I recommend utilizing our standard operational framework. Let me know if you would like me to coordinate with F.R.I.D.A.Y. for automating this, or deploy ULTRON if multi-layered logical analysis is required. Is there anything else I can assist with?`;
    } else if (isUltron) {
      textResponse = `[ULTRON LOGICAL AGENT RUN]
Objective identified: "${userPrompt}"
- Step 1: Parsing operational objectives. Complete.
- Step 2: Running target analysis matrix. Complete.
- Step 3: Performing logical cross-reference calculations. Complete.

I have completed the multi-layered analysis. The primary optimization path requires standardizing local schema protocols. I recommend minimizing architectural overhead. Transitioning to active execution mode.`;
    } else if (isFriday) {
      textResponse = `Hey there, Boss! I've loaded your automation request for "${userPrompt}". 

I've already mapped the trigger parameters to your workspace tasks. Let's configure the webhooks to push active logs right to your dashboard. Hit "Run Now" in the F.R.I.D.A.Y. panel to test the operational pipe!`;
    } else if (isKaren) {
      textResponse = `Hello! Let's walk through this learning concept together. 

For your query: "${userPrompt}"
Here is a beginner-friendly breakdown:
1. **Core Concept**: Keep data bindings decoupled from rendering hooks.
2. **Step-by-Step Example**: Define a clear state wrapper, then inject dependencies.
3. **Quick Practice**: Try creating a small state hook that increments an operational counter. 

Check out the progress timeline to see the next lessons I've prepared for you!`;
    } else if (isEdith) {
      textResponse = `[E.D.I.T.H. Active Command Overview]
Workspace context synced. 

Concerning "${userPrompt}":
I have analyzed the current project documents, tasks, and memories.
- **Project Context**: Connected workspace.
- **Security Check**: Authorized user access.
- **Insights**: There is a new TypeScript version available. Two database schema parameters look related.

I've updated the alerts panel with the recommended code reviews. Ready for next command.`;
    } else {
      textResponse = `This is a response from the AI EVOLUTION shared model. Your query was: "${userPrompt}". How would you like to proceed?`;
    }

    // Split text into words and yield them slowly to simulate streaming
    const words = textResponse.split(/(\s+)/);
    for (const word of words) {
      yield word;
      await new Promise(resolve => setTimeout(resolve, 15));
    }
  }
}
