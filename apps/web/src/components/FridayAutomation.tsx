import React, { useState, useEffect } from 'react';
import { Play, Trash2, Cpu, FileText, CheckCircle, XCircle, Plus, ToggleLeft, ToggleRight, ListCollapse } from 'lucide-react';
import { api } from '../utils/api.js';

export const FridayAutomation: React.FC = () => {
  const [automations, setAutomations] = useState<any[]>([]);
  const [selectedLogs, setSelectedLogs] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [triggerType, setTriggerType] = useState('CRON');
  const [triggerConfig, setTriggerConfig] = useState('{"interval":"daily","time":"09:00"}');
  const [actionType, setActionType] = useState('SLACK');
  const [actionConfig, setActionConfig] = useState('{"channel":"#system-alerts","template":"Summary Completed."}');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchAutomations();
  }, []);

  const fetchAutomations = async () => {
    try {
      const list = await api.workspace.automations.list();
      setAutomations(list);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      let trig = {};
      let act = {};
      try {
        trig = JSON.parse(triggerConfig);
        act = JSON.parse(actionConfig);
      } catch (e) {
        alert("Invalid JSON format in Trigger or Action Configuration.");
        return;
      }

      await api.workspace.automations.create({
        name,
        triggerType,
        triggerConfig: trig,
        actionType,
        actionConfig: act
      });

      setName('');
      fetchAutomations();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.workspace.automations.delete(id);
      fetchAutomations();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRunNow = async (id: string) => {
    setIsLoading(true);
    try {
      const run = await api.workspace.automations.run(id);
      setSelectedLogs(run.log);
      fetchAutomations();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await api.workspace.automations.update(id, { isActive: !currentStatus });
      fetchAutomations();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#030712] relative font-mono select-none overflow-y-auto p-6">
      <div className="absolute inset-0 bg-cyber-grid pointer-events-none" />

      {/* Header */}
      <div className="border-b border-gray-900 pb-4 mb-6 z-10">
        <h2 className="text-sm font-bold tracking-widest text-friday glow-text-friday uppercase">
          F.R.I.D.A.Y. Automation & Dispatch Engine
        </h2>
        <p className="text-[10px] text-gray-500 uppercase mt-0.5 tracking-wider">
          Visual Trigger-Action Pipelines & Integration Syncing
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto w-full z-10 items-start">
        
        {/* Create flow card */}
        <div className="hud-glass border border-friday/20 p-5 rounded-xl space-y-4 lg:col-span-1">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
            <Plus className="w-4 h-4 text-friday" />
            Build Automation Node
          </h3>

          <form onSubmit={handleCreate} className="space-y-4 text-xs font-mono">
            <div>
              <label className="block text-gray-500 uppercase tracking-widest mb-1">Workflow Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Daily Update Dispatch"
                className="w-full bg-[#02050c] border border-gray-800 rounded p-2 focus:border-friday focus:outline-none placeholder-gray-700 text-white"
              />
            </div>

            <div>
              <label className="block text-gray-500 uppercase tracking-widest mb-1">Trigger Type</label>
              <select
                value={triggerType}
                onChange={e => setTriggerType(e.target.value)}
                className="w-full bg-[#02050c] border border-gray-800 rounded p-2 focus:border-friday focus:outline-none text-white uppercase"
              >
                <option value="CRON">CRON / SCHEDULER</option>
                <option value="WEBHOOK">WEBHOOK / INCOMING LINK</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-500 uppercase tracking-widest mb-1">Trigger Params (JSON)</label>
              <textarea
                required
                value={triggerConfig}
                onChange={e => setTriggerConfig(e.target.value)}
                rows={2}
                className="w-full bg-[#02050c] border border-gray-800 rounded p-2 focus:border-friday focus:outline-none font-mono text-[10px] text-white"
              />
            </div>

            <div>
              <label className="block text-gray-500 uppercase tracking-widest mb-1">Action Type</label>
              <select
                value={actionType}
                onChange={e => setActionType(e.target.value)}
                className="w-full bg-[#02050c] border border-gray-800 rounded p-2 focus:border-friday focus:outline-none text-white uppercase"
              >
                <option value="SLACK">DISPATCH SLACK WEBHOOK</option>
                <option value="EMAIL">SEND OPERATOR EMAIL</option>
                <option value="GITHUB">TRIGGER GITHUB ACTIONS</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-500 uppercase tracking-widest mb-1">Action Params (JSON)</label>
              <textarea
                required
                value={actionConfig}
                onChange={e => setActionConfig(e.target.value)}
                rows={2}
                className="w-full bg-[#02050c] border border-gray-800 rounded p-2 focus:border-friday focus:outline-none font-mono text-[10px] text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-friday/10 hover:bg-friday hover:text-cyber-bg border border-friday/30 text-friday font-bold rounded uppercase tracking-widest shadow-hud-friday text-xs transition-colors"
            >
              Assemble Pipeline
            </button>
          </form>
        </div>

        {/* List automations */}
        <div className="lg:col-span-2 space-y-6">
          <div className="hud-glass border border-gray-900 p-5 rounded-xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Cpu className="w-4 h-4 text-friday" />
              Active Connections
            </h3>

            {automations.length === 0 ? (
              <div className="text-center py-6 text-gray-600 uppercase text-xs">No active automation scripts found.</div>
            ) : (
              <div className="space-y-4">
                {automations.map(aut => (
                  <div key={aut.id} className="p-4 border border-gray-900 bg-cyber-card/30 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white uppercase text-xs">{aut.name}</h4>
                        <span className="text-[9px] bg-friday/10 border border-friday/20 text-friday px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                          {aut.actionType}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 font-mono">
                        Trigger: {aut.triggerType} ({JSON.stringify(aut.triggerConfig)})
                      </p>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <button
                        onClick={() => handleToggleActive(aut.id, aut.isActive)}
                        title={aut.isActive ? "Deactivate" : "Activate"}
                        className="text-gray-500 hover:text-white"
                      >
                        {aut.isActive ? (
                          <ToggleRight className="w-6 h-6 text-friday" />
                        ) : (
                          <ToggleLeft className="w-6 h-6" />
                        )}
                      </button>
                      
                      <button
                        onClick={() => handleRunNow(aut.id)}
                        disabled={isLoading}
                        title="Execute automation trigger now"
                        className="p-1.5 border border-friday/30 bg-friday/5 text-friday rounded hover:bg-friday hover:text-cyber-bg transition-colors"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                      
                      <button
                        onClick={() => handleDelete(aut.id)}
                        className="p-1.5 border border-gray-900 text-gray-500 hover:text-ultron rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Execution logs output console */}
          {selectedLogs && (
            <div className="border border-gray-900 rounded-xl overflow-hidden bg-[#01040a]">
              <div className="flex justify-between items-center p-3 bg-gray-900/30 border-b border-gray-900 text-[10px] font-bold text-gray-500 uppercase">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-friday animate-pulse" />
                  Execution Logs Output
                </span>
                <button onClick={() => setSelectedLogs(null)} className="text-gray-500 hover:text-white">
                  Clear Panel
                </button>
              </div>
              <pre className="p-4 font-mono text-[9px] text-karen overflow-x-auto whitespace-pre-wrap leading-normal">
                {selectedLogs}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
