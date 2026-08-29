import React from 'react';
import { Shield, Brain, Cpu, GraduationCap, Command, MessageSquare, Briefcase, FileText, Settings, Database, LogOut } from 'lucide-react';
import { clearAuthToken } from '../utils/api.js';

interface SidebarProps {
  currentSystem: string;
  onChangeSystem: (system: 'JARVIS' | 'ULTRON' | 'FRIDAY' | 'KAREN' | 'EDITH') => void;
  activeTab: string;
  onChangeTab: (tab: string) => void;
  conversations: any[];
  activeConvId: string | null;
  onSelectConv: (id: string) => void;
  onCreateConv: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSystem,
  onChangeSystem,
  activeTab,
  onChangeTab,
  conversations,
  activeConvId,
  onSelectConv,
  onCreateConv,
  onLogout
}) => {
  const systems = [
    { id: 'JARVIS', name: 'J.A.R.V.I.S.', icon: Shield, color: 'text-jarvis hover:border-jarvis/50', activeBorder: 'border-jarvis shadow-hud-jarvis' },
    { id: 'ULTRON', name: 'ULTRON', icon: Brain, color: 'text-ultron hover:border-ultron/50', activeBorder: 'border-ultron shadow-hud-ultron' },
    { id: 'FRIDAY', name: 'F.R.I.D.A.Y.', icon: Cpu, color: 'text-friday hover:border-friday/50', activeBorder: 'border-friday shadow-hud-friday' },
    { id: 'KAREN', name: 'K.A.R.E.N.', icon: GraduationCap, color: 'text-karen hover:border-karen/50', activeBorder: 'border-karen shadow-hud-karen' },
    { id: 'EDITH', name: 'E.D.I.T.H.', icon: Command, color: 'text-edith hover:border-edith/50', activeBorder: 'border-edith shadow-hud-edith' }
  ];

  const tabs = [
    { id: 'chat', label: 'Chats', icon: MessageSquare },
    { id: 'projects', label: 'Projects', icon: Briefcase },
    { id: 'knowledge', label: 'Knowledge', icon: FileText },
    { id: 'automations', label: 'Automations', icon: Cpu },
    { id: 'tasks', label: 'System Memory', icon: Database }
  ];

  const handleLogout = () => {
    clearAuthToken();
    onLogout();
  };

  return (
    <div className="w-64 bg-cyber-bg border-r border-gray-900 flex flex-col h-full font-mono select-none">
      {/* App Header */}
      <div className="p-4 border-b border-gray-900 flex items-center gap-2">
        <div className="w-5 h-5 rounded-full border border-jarvis flex items-center justify-center animate-pulse">
          <div className="w-2 h-2 rounded-full bg-jarvis" />
        </div>
        <span className="text-sm font-bold tracking-widest text-white">AI EVOLUTION</span>
      </div>

      {/* AI Systems List */}
      <div className="p-4 border-b border-gray-900">
        <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-3">AI Systems</div>
        <div className="space-y-2">
          {systems.map(sys => {
            const Icon = sys.icon;
            const isActive = currentSystem === sys.id;
            return (
              <button
                key={sys.id}
                onClick={() => onChangeSystem(sys.id as any)}
                className={`w-full flex items-center gap-3 px-3 py-2 border rounded text-xs transition-all ${
                  isActive 
                    ? `bg-cyber-card text-white ${sys.activeBorder}` 
                    : `border-gray-900 bg-transparent text-gray-400 ${sys.color}`
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-bold tracking-widest uppercase">{sys.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="p-4 border-b border-gray-900 flex gap-2 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id)}
                title={tab.label}
                className={`p-2 rounded border transition-colors ${
                  isActive ? 'border-jarvis/30 bg-jarvis/5 text-jarvis' : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>

        {/* Tab Content Panel */}
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          {activeTab === 'chat' && (
            <div className="space-y-3 h-full flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest">Active Channels</span>
                  <button 
                    onClick={onCreateConv}
                    className="text-[10px] text-jarvis border border-jarvis/30 px-2 py-0.5 rounded hover:bg-jarvis/10 transition-colors uppercase"
                  >
                    + New
                  </button>
                </div>
                {conversations.length === 0 ? (
                  <div className="text-[10px] text-gray-600 text-center py-4 uppercase">No conversations active</div>
                ) : (
                  <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                    {conversations.map(conv => (
                      <button
                        key={conv.id}
                        onClick={() => onSelectConv(conv.id)}
                        className={`w-full text-left px-2 py-1.5 rounded text-[11px] truncate uppercase block ${
                          activeConvId === conv.id 
                            ? 'bg-jarvis/5 border border-jarvis/20 text-white' 
                            : 'text-gray-400 hover:bg-gray-900/50 hover:text-gray-200'
                        }`}
                      >
                        {conv.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'projects' && (
            <div className="space-y-2">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest">Connected Workspace</span>
              <div className="p-3 border border-gray-900 rounded bg-cyber-card/30">
                <div className="text-[11px] text-white font-bold truncate">Primary Evolution Workspace</div>
                <div className="text-[9px] text-gray-500 mt-1">ID: Default Node</div>
              </div>
            </div>
          )}

          {activeTab === 'knowledge' && (
            <div className="space-y-2 text-center py-4">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest block mb-2">Sources Ingestion</span>
              <p className="text-[9px] text-gray-600 uppercase">Use the active workspace panel on right to index PDF / Text files.</p>
            </div>
          )}

          {activeTab === 'automations' && (
            <div className="space-y-2 text-center py-4">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest block mb-2">F.R.I.D.A.Y. Flows</span>
              <p className="text-[9px] text-gray-600 uppercase">Switch AI Mode to F.R.I.D.A.Y. to manage active triggers.</p>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-2 text-center py-4">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest block mb-2">Workspace Memory</span>
              <p className="text-[9px] text-gray-600 uppercase">Preferences mapped automatically in the right panel.</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-gray-900 flex justify-between items-center text-[10px]">
        <span className="text-gray-600">OS V1.0.8</span>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 text-ultron hover:text-red-400 transition-colors uppercase font-bold"
        >
          <LogOut className="w-3.5 h-3.5" />
          Disconnect
        </button>
      </div>
    </div>
  );
};
