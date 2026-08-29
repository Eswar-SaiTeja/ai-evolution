import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Compass, MessageSquare, Plus, FileText, Settings, X } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onSwitchSystem: (mode: 'JARVIS' | 'ULTRON' | 'FRIDAY' | 'KAREN' | 'EDITH') => void;
  onChangeTab: (tab: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNewChat,
  onSwitchSystem,
  onChangeTab
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const commands = [
    { label: 'Create New Conversation Thread', category: 'Chat', action: () => { onNewChat(); onClose(); }, icon: MessageSquare },
    { label: 'Switch mode to J.A.R.V.I.S. (Assistant)', category: 'System', action: () => { onSwitchSystem('JARVIS'); onClose(); }, icon: Compass },
    { label: 'Switch mode to ULTRON (Autonomous Agent)', category: 'System', action: () => { onSwitchSystem('ULTRON'); onClose(); }, icon: Compass },
    { label: 'Switch mode to F.R.I.D.A.Y. (Automation)', category: 'System', action: () => { onSwitchSystem('FRIDAY'); onClose(); }, icon: Compass },
    { label: 'Switch mode to K.A.R.E.N. (Mentorship)', category: 'System', action: () => { onSwitchSystem('KAREN'); onClose(); }, icon: Compass },
    { label: 'Switch mode to E.D.I.T.H. (Command Center)', category: 'System', action: () => { onSwitchSystem('EDITH'); onClose(); }, icon: Compass },
    { label: 'Manage Vector Knowledge Base', category: 'Workspace', action: () => { onChangeTab('knowledge'); onClose(); }, icon: FileText },
    { label: 'Open Workspace Connection Settings', category: 'Settings', action: () => { onChangeTab('chat'); onClose(); }, icon: Settings }
  ];

  const filtered = commands.filter(c => 
    c.label.toLowerCase().includes(query.toLowerCase()) || 
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-cyber-bg/85 backdrop-blur-sm z-50 flex items-start justify-center pt-24 font-mono p-4">
      <div 
        className="w-full max-w-lg hud-glass border border-jarvis/30 rounded-xl overflow-hidden shadow-hud-jarvis flex flex-col max-h-[400px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search header */}
        <div className="flex items-center gap-2 p-3 border-b border-gray-900 bg-cyber-bg/60">
          <Search className="w-4 h-4 text-jarvis" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type search command parameters..."
            className="flex-1 bg-transparent text-white text-xs border-none focus:outline-none focus:ring-0 font-mono"
          />
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Options list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.map((cmd, i) => {
            const Icon = cmd.icon;
            return (
              <button
                key={i}
                onClick={cmd.action}
                className="w-full text-left p-2.5 rounded hover:bg-jarvis/5 border border-transparent hover:border-jarvis/25 flex items-center justify-between text-xs transition-all uppercase block"
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-3.5 h-3.5 text-jarvis" />
                  <span className="text-white font-bold">{cmd.label}</span>
                </div>
                <span className="text-[9px] text-gray-500 bg-gray-900 border border-gray-800 px-1.5 py-0.5 rounded font-bold">
                  {cmd.category}
                </span>
              </button>
            );
          })}
          
          {filtered.length === 0 && (
            <div className="text-center py-6 text-gray-600 text-xs uppercase">No commands match parameters.</div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-2 border-t border-gray-900 bg-cyber-bg/40 flex justify-between items-center text-[9px] text-gray-500">
          <span>CTRL+K TO DISMISS</span>
          <span>ESC TO CLOSE</span>
        </div>
      </div>
    </div>
  );
};
