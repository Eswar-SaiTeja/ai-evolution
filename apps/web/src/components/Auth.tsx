import React, { useState } from 'react';
import { api, setAuthToken } from '../utils/api.js';

interface AuthProps {
  onSuccess: (projectId: string) => void;
}

export const Auth: React.FC<AuthProps> = ({ onSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        const res = await api.auth.register({ email, password, name });
        setAuthToken(res.token);
        onSuccess(res.defaultProjectId);
      } else {
        const res = await api.auth.login({ email, password });
        setAuthToken(res.token);
        onSuccess(res.defaultProjectId);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Demo bypass triggers a default login/register automatically
  const handleDemoBypass = async () => {
    setError('');
    setLoading(true);
    const demoEmail = `demo_${Math.floor(Math.random() * 10000)}@aievolution.com`;
    const demoPassword = 'password123';
    const demoName = 'Core Operator';

    try {
      // Attempt register first, if fails try login
      const res = await api.auth.register({ email: demoEmail, password: demoPassword, name: demoName });
      setAuthToken(res.token);
      onSuccess(res.defaultProjectId);
    } catch (e) {
      try {
        const res = await api.auth.login({ email: 'demo@aievolution.com', password: 'password123' });
        setAuthToken(res.token);
        onSuccess(res.defaultProjectId);
      } catch (err: any) {
        setError('Demo bypass failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative scanlines">
      <div className="absolute inset-0 bg-cyber-grid pointer-events-none" />
      
      <div className="w-full max-w-md hud-glass border border-jarvis/30 p-8 rounded-xl shadow-hud-jarvis relative z-10">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full border border-jarvis flex items-center justify-center mx-auto mb-3 shadow-hud-jarvis">
            <div className="w-4 h-4 rounded-full bg-jarvis animate-ping" />
          </div>
          <h2 className="text-2xl font-bold font-mono tracking-widest text-white">
            OPERATOR AUTHENTICATION
          </h2>
          <p className="text-xs text-gray-500 font-mono tracking-widest mt-1 uppercase">
            AI EVOLUTION SECURE GATEWAY
          </p>
        </div>

        {error && (
          <div className="p-3 bg-ultron/10 border border-ultron/30 text-ultron text-xs font-mono rounded mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-sm">
          {isSignUp && (
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-widest mb-1">Operator Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter username"
                className="w-full bg-cyber-bg border border-jarvis/20 text-white rounded p-2 focus:border-jarvis focus:outline-none transition-all placeholder-gray-700"
              />
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-widest mb-1">Email Node Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="operator@aievolution.com"
              className="w-full bg-cyber-bg border border-jarvis/20 text-white rounded p-2 focus:border-jarvis focus:outline-none transition-all placeholder-gray-700"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-widest mb-1">Security Keyphrase</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-cyber-bg border border-jarvis/20 text-white rounded p-2 focus:border-jarvis focus:outline-none transition-all placeholder-gray-700"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-jarvis/10 hover:bg-jarvis hover:text-cyber-bg border border-jarvis/50 text-jarvis font-bold tracking-widest uppercase rounded transition-colors text-xs shadow-hud-jarvis"
          >
            {loading ? 'SYNCING MATRIX...' : isSignUp ? 'CREATE ACCOUNT' : 'DECRYPT ACCESS'}
          </button>
        </form>

        <div className="flex justify-between items-center mt-6 text-xs font-mono text-gray-500">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="hover:text-jarvis underline uppercase transition-colors"
          >
            {isSignUp ? 'Already registered? Sign In' : 'New operator? Sign Up'}
          </button>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-900" /></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#0b0f20] px-2 text-gray-600 font-mono">Or Bypass</span></div>
        </div>

        <button
          onClick={handleDemoBypass}
          disabled={loading}
          className="w-full py-3 bg-edith/10 hover:bg-edith hover:text-white border border-edith/40 text-edith font-bold tracking-widest uppercase rounded transition-colors text-xs shadow-hud-edith"
        >
          Initialize Demo Mode (One-Click)
        </button>
      </div>
    </div>
  );
};
