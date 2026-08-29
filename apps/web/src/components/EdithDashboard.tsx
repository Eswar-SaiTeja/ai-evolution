import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { ShieldAlert, AlertTriangle, CheckCircle, Database, HelpCircle, Activity, LayoutGrid, Terminal } from 'lucide-react';
import { api } from '../utils/api.js';

interface EdithDashboardProps {
  projectId: string;
}

export const EdithDashboard: React.FC<EdithDashboardProps> = ({ projectId }) => {
  const [insights, setInsights] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    fetchInsights();
    const interval = setInterval(fetchInsights, 8000);
    return () => clearInterval(interval);
  }, [projectId]);

  const fetchInsights = async () => {
    try {
      const data = await api.workspace.insights(projectId);
      setInsights(data.insights);
      setMetrics(data.metrics);
    } catch (e) {
      console.warn("Failed fetching project insights");
    }
  };

  // Mock data for Recharts token usage dashboard
  const usageData = [
    { name: '08/24', tokens: 12000, cost: 0.15 },
    { name: '08/25', tokens: 28000, cost: 0.32 },
    { name: '08/26', tokens: 19000, cost: 0.22 },
    { name: '08/27', tokens: 42000, cost: 0.54 },
    { name: '08/28', tokens: 53000, cost: 0.68 },
    { name: '08/29', tokens: 31000, cost: 0.39 }
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#030712] relative font-mono select-none overflow-y-auto p-6">
      <div className="absolute inset-0 bg-cyber-grid pointer-events-none" />

      {/* Header */}
      <div className="border-b border-gray-900 pb-4 mb-6 z-10">
        <h2 className="text-sm font-bold tracking-widest text-edith glow-text-edith uppercase">
          E.D.I.T.H. Executive Command Center
        </h2>
        <p className="text-[10px] text-gray-500 uppercase mt-0.5 tracking-wider">
          Workspace Intelligence, Dependency Warnings & Security Audits
        </p>
      </div>

      <div className="max-w-7xl mx-auto w-full z-10 space-y-6">
        
        {/* Metrics Grid */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="hud-glass border border-gray-900 p-4 rounded-xl">
              <span className="text-[9px] text-gray-500 uppercase tracking-widest block font-bold">Document Nodes</span>
              <span className="text-white text-xl font-bold mt-1 block">{metrics.totalDocs} Files</span>
            </div>
            <div className="hud-glass border border-gray-900 p-4 rounded-xl">
              <span className="text-[9px] text-gray-500 uppercase tracking-widest block font-bold">Outstanding Actions</span>
              <span className="text-white text-xl font-bold mt-1 block">{metrics.pendingTasks} Pending</span>
            </div>
            <div className="hud-glass border border-gray-900 p-4 rounded-xl">
              <span className="text-[9px] text-gray-500 uppercase tracking-widest block font-bold">Friday Connections</span>
              <span className="text-white text-xl font-bold mt-1 block">{metrics.activeAutomations} Active</span>
            </div>
            <div className="hud-glass border border-gray-900 p-4 rounded-xl">
              <span className="text-[9px] text-gray-500 uppercase tracking-widest block font-bold">RAG Index Health</span>
              <span className="text-karen text-xl font-bold mt-1 block">{metrics.knowledgeFreshnessPercent}% Sync</span>
            </div>
          </div>
        )}

        {/* Dashboard body: Charts + Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Charts left */}
          <div className="lg:col-span-2 space-y-6">
            <div className="hud-glass border border-gray-900 p-5 rounded-xl space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-edith" />
                Token Resource Utilization (Weekly)
              </h3>
              
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={usageData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#9d4edd" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#9d4edd" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#555" fontSize={9} tickLine={false} />
                    <YAxis stroke="#555" fontSize={9} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#0a0f1e', border: '1px solid #9d4edd', fontSize: 10 }} />
                    <Area type="monotone" dataKey="tokens" stroke="#9d4edd" fillOpacity={1} fill="url(#colorTokens)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* System Task matrix lists */}
            <div className="hud-glass border border-gray-900 p-5 rounded-xl space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
                <LayoutGrid className="w-4 h-4 text-edith" />
                Active Task Coordinates
              </h3>
              <div className="space-y-2">
                <div className="p-2.5 border border-gray-900 bg-cyber-card/25 rounded flex justify-between items-center">
                  <div className="text-[11px] text-gray-300 font-bold uppercase">Index latest repository modifications</div>
                  <span className="text-[9px] border border-friday/25 text-friday px-1.5 rounded font-bold uppercase">In Progress</span>
                </div>
                <div className="p-2.5 border border-gray-900 bg-cyber-card/25 rounded flex justify-between items-center">
                  <div className="text-[11px] text-gray-300 font-bold uppercase">Decouple API route bindings</div>
                  <span className="text-[9px] border border-karen/25 text-karen px-1.5 rounded font-bold uppercase">Completed</span>
                </div>
              </div>
            </div>
          </div>

          {/* System Alerts list right */}
          <div className="lg:col-span-1 hud-glass border border-gray-900 p-5 rounded-xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-edith" />
              Intelligence Warnings
            </h3>

            <div className="space-y-3.5">
              {insights.map((ins, i) => {
                const Icon = ins.type === 'WARNING' ? AlertTriangle : ins.type === 'SUCCESS' ? CheckCircle : HelpCircle;
                const borderClass = ins.type === 'WARNING' ? 'border-ultron/30 bg-ultron/5 text-ultron' : ins.type === 'SUCCESS' ? 'border-karen/30 bg-karen/5 text-karen' : 'border-jarvis/30 bg-jarvis/5 text-jarvis';
                
                return (
                  <div key={ins.id || i} className={`p-3 border rounded-lg flex gap-3 ${borderClass}`}>
                    <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-white text-[11px] uppercase">{ins.title}</h4>
                      <p className="text-[10px] text-gray-400 leading-normal">{ins.description}</p>
                      <span className="text-[8px] text-gray-600 uppercase block font-bold">{ins.component}</span>
                    </div>
                  </div>
                );
              })}
              
              {insights.length === 0 && (
                <div className="text-center py-10 text-gray-600 uppercase text-xs">No alerts detected. Workspace clean.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
