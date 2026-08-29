const API_BASE = 'http://localhost:5000/api';

export const getAuthToken = () => localStorage.getItem('token');
export const setAuthToken = (token: string) => localStorage.setItem('token', token);
export const clearAuthToken = () => localStorage.removeItem('token');

async function request(path: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP error ${response.status}`);
  }

  return response.json();
}

export const api = {
  auth: {
    register: (body: any) => fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(res => { if (!res.ok) throw new Error('Registration failed'); return res.json(); }),
    
    login: (body: any) => fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(res => { if (!res.ok) throw new Error('Login failed'); return res.json(); }),
    
    me: () => request('/auth/me')
  },
  chat: {
    list: (projectId?: string) => request(`/chat/conversations?projectId=${projectId || ''}`),
    create: (body: any) => request('/chat/conversations', {
      method: 'POST',
      body: JSON.stringify(body)
    }),
    delete: (id: string) => request(`/chat/conversations/${id}`, {
      method: 'DELETE'
    }),
    getMessages: (id: string) => request(`/chat/messages/${id}`),
    getAgentRun: (conversationId: string) => request(`/chat/agent-run/${conversationId}`),
    
    // SSE Stream
    stream: async (body: any, onChunk: (text: string) => void, onMetadata: (meta: any) => void, onError: (err: string) => void) => {
      const token = getAuthToken();
      try {
        const response = await fetch(`${API_BASE}/chat/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify(body)
        });

        if (!response.ok) {
          throw new Error(`SSE request failed with code ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) return;

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() || '';

          for (const part of parts) {
            const lines = part.split('\n');
            let event = '';
            let data = '';

            for (const line of lines) {
              if (line.startsWith('event: ')) {
                event = line.slice(7).trim();
              } else if (line.startsWith('data: ')) {
                data = line.slice(6).trim();
              }
            }

            if (!event || !data) continue;

            try {
              const parsed = JSON.parse(data);
              if (event === 'chunk') {
                onChunk(parsed.chunk);
              } else if (event === 'metadata') {
                onMetadata(parsed);
              } else if (event === 'error') {
                onError(parsed.error);
              } else if (event === 'done') {
                // Done event
              }
            } catch (e) {
              // Parse error
            }
          }
        }
      } catch (err: any) {
        onError(err.message || 'Stream processing connection terminated.');
      }
    }
  },
  workspace: {
    projects: {
      list: () => request('/workspace/projects'),
      create: (body: any) => request('/workspace/projects', {
        method: 'POST',
        body: JSON.stringify(body)
      })
    },
    documents: {
      list: (projectId?: string) => request(`/workspace/documents?projectId=${projectId || ''}`),
      upload: (body: any) => request('/workspace/documents', {
        method: 'POST',
        body: JSON.stringify(body)
      }),
      delete: (id: string) => request(`/workspace/documents/${id}`, {
        method: 'DELETE'
      })
    },
    memories: {
      list: (projectId?: string) => request(`/workspace/memories?projectId=${projectId || ''}`),
      create: (body: any) => request('/workspace/memories', {
        method: 'POST',
        body: JSON.stringify(body)
      }),
      delete: (id: string) => request(`/workspace/memories/${id}`, {
        method: 'DELETE'
      }),
      clear: () => request('/workspace/memories', {
        method: 'DELETE'
      })
    },
    automations: {
      list: () => request('/workspace/automations'),
      create: (body: any) => request('/workspace/automations', {
        method: 'POST',
        body: JSON.stringify(body)
      }),
      update: (id: string, body: any) => request(`/workspace/automations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body)
      }),
      delete: (id: string) => request(`/workspace/automations/${id}`, {
        method: 'DELETE'
      }),
      run: (id: string) => request(`/workspace/automations/${id}/run`, {
        method: 'POST'
      })
    },
    courses: {
      list: () => request('/workspace/courses'),
      create: (body: any) => request('/workspace/courses', {
        method: 'POST',
        body: JSON.stringify(body)
      }),
      quiz: (body: any) => request('/workspace/courses/quiz', {
        method: 'POST',
        body: JSON.stringify(body)
      })
    },
    insights: (projectId: string) => request(`/workspace/insights?projectId=${projectId}`)
  },
  admin: {
    status: () => request('/admin/status'),
    models: () => request('/admin/models')
  }
};
