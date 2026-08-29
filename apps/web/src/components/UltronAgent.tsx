import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Terminal, ShieldAlert, Cpu, CheckCircle, Search, HelpCircle } from 'lucide-react';
import { api } from '../utils/api.js';

interface UltronAgentProps {
  projectId: string;
  conversationId: string | null;
}

export const UltronAgent: React.FC<UltronAgentProps> = ({ projectId, conversationId }) => {
  const [objective, setObjective] = useState('');
  const [activeRun, setActiveRun] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isConsoleOpen, setIsConsoleOpen] = useState(true);

  useEffect(() => {
    if (!conversationId) return;
    fetchRunStatus();
    const interval = setInterval(fetchRunStatus, 2000);
    return () => clearInterval(interval);
  }, [conversationId]);

  const fetchRunStatus = async () => {
    if (!conversationId) return;
    try {
      const data = await api.chat.getAgentRun(conversationId);
      setActiveRun(data);
    } catch (e) {
      // No active runs found yet
    }
  };

  const handleStartAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!objective.trim() || !conversationId) return;

    setLoading(true);
    try {
      // Trigger streaming message with ULTRON override to start background run
      await api.chat.stream(
        {
          conversationId,
          query: objective,
          overrideMode: 'ULTRON',
          projectId
        },
        () => {},
        () => {},
        () => {}
      );
      setObjective('');
      fetchRunStatus();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const stepsList = ['PLAN', 'SEARCH', 'ANALYZE', 'COMPARE', 'VERIFY', 'GENERATE', 'FINAL_RESULT'];

  const getStepStatus = (stepName: string) => {
    if (!activeRun || !activeRun.steps) return 'PENDING';
    const log = activeRun.steps.find((s: any) => s.step === stepName);
    return log ? log.status : 'PENDING';
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case 'RUNNING': return 'border-friday text-friday shadow-hud-friday animate-pulse';
      case 'COMPLETED': return 'border-karen text-karen shadow-hud-karen';
      case 'FAILED': return 'border-ultron text-ultron shadow-hud-ultron';
      default: return 'border-gray-800 text-gray-600 bg-transparent';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#030712] relative font-mono select-none overflow-y-auto p-6">
      <div className="absolute inset-0 bg-cyber-grid pointer-events-none" />

      {/* Header */}
      <div className="border-b border-gray-900 pb-4 mb-6 z-10">
        <h2 className="text-sm font-bold tracking-widest text-ultron glow-text-ultron uppercase">
          ULTRON Reasoning Agent Engine
        </h2>
        <p className="text-[10px] text-gray-500 uppercase mt-0.5 tracking-wider">
          Multi-Step Task Decomposition & Autonomous Verification
        </p>
      </div>

      <div className="max-w-4xl mx-auto w-full z-10 space-y-6">
        {/* Objective formulation input */}
        {!activeRun || activeRun.status === 'COMPLETED' || activeRun.status === 'FAILED' ? (
          <form onSubmit={handleStartAgent} className="hud-glass border border-ultron/20 p-6 rounded-xl space-y-4">
            <label className="block text-xs uppercase tracking-widest text-gray-400 font-bold">
              Formulate Autonomous Objective
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={objective}
                onChange={e => setObjective(e.target.value)}
                placeholder="e.g. Research the best cloud architecture for my startup comparing 20 nodes..."
                className="flex-1 bg-[#02050c] border border-gray-800 text-white rounded p-3 text-xs focus:border-ultron focus:outline-none placeholder-gray-700 transition-all"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 bg-ultron/10 hover:bg-ultron hover:text-white border border-ultron/50 text-ultron rounded font-bold tracking-widest uppercase transition-colors text-xs flex items-center gap-1.5 shadow-hud-ultron"
              >
                <Play className="w-3.5 h-3.5" />
                {loading ? 'DEPLOYING...' : 'DEPLOY AGENT'}
              </button>
            </div>
          </form>
        ) : (
          /* Active Run Monitor UI */
          <div className="hud-glass border border-ultron/30 p-6 rounded-xl space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Active Objective</span>
                <h3 className="text-white text-sm font-bold uppercase mt-1">{activeRun.objective}</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-friday animate-ping" />
                <span className="text-[10px] text-friday font-bold uppercase tracking-widest">{activeRun.status}</span>
              </div>
            </div>

            {/* Visual Process Timeline */}
            <div className="relative py-4">
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-900 -translate-y-1/2 hidden md:block" />
              <div className="grid grid-cols-2 md:grid-cols-7 gap-4 relative">
                {stepsList.map((step, idx) => {
                  const stepStatus = getStepStatus(step);
                  const colorClass = getStepColor(stepStatus);

                  return (
                    <div key={step} className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full border flex items-center justify-center font-bold text-xs bg-cyber-bg transition-all ${colorClass}`}>
                        {idx + 1}
                      </div>
                      <span className="text-[9px] font-bold mt-2 tracking-widest text-gray-500 text-center uppercase">
                        {step.replace('_', ' ')}
                      </span>
                      <span className="text-[8px] text-gray-600 uppercase mt-0.5">{stepStatus}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-end gap-3 pt-3 border-t border-gray-900">
              <button className="px-4 py-1.5 border border-gray-800 rounded text-gray-400 hover:text-white text-xs flex items-center gap-1.5 uppercase font-bold">
                <Pause className="w-3.5 h-3.5" /> Pause Run
              </button>
              <button 
                onClick={() => setActiveRun(null)}
                className="px-4 py-1.5 border border-ultron/30 hover:border-ultron bg-ultron/5 rounded text-ultron hover:text-white text-xs flex items-center gap-1.5 uppercase font-bold"
              >
                <Square className="w-3.5 h-3.5" /> Force Halt
              </button>
            </div>
          </div>
        )}

        {/* Expandable Agent Activity console logs */}
        {activeRun && (
          <div className="border border-gray-900 rounded-xl overflow-hidden bg-cyber-bg">
            <button
              onClick={() => setIsConsoleOpen(!isConsoleOpen)}
              className="w-full flex justify-between items-center p-4 bg-gray-900/30 text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-white transition-colors"
            >
              <span className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-ultron animate-pulse" />
                Agent Activity Logs
              </span>
              <span>{isConsoleOpen ? 'Minimize' : 'Expand'}</span>
            </button>
            
            {isConsoleOpen && (
              <div className="p-4 bg-[#01040a] font-mono text-[10px] text-gray-400 h-64 overflow-y-auto space-y-2">
                <div className="text-gray-500">[{new Date(activeRun.createdAt).toLocaleString()}] Loading execution parameters...</div>
                {activeRun.steps && activeRun.steps.map((log: any, idx: number) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center font-bold text-white uppercase border-b border-gray-900 pb-0.5 mt-2">
                      <span>&gt; Step: {log.step}</span>
                      <span className={log.status === 'COMPLETED' ? 'text-karen' : 'text-friday'}>{log.status}</span>
                    </div>
                    <pre className="text-gray-400 whitespace-pre-wrap leading-normal font-mono py-1">{log.log}</pre>
                  </div>
                ))}
                {activeRun.status === 'RUNNING' && (
                  <div className="text-friday animate-pulse mt-2 flex items-center gap-1">
                    <Cpu className="w-3.5 h-3.5 animate-spin" />
                    Computing next logical iteration...
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
