import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage.tsx';
import { Auth } from './components/Auth.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { RightPanel } from './components/RightPanel.tsx';
import { JarvisCore } from './components/JarvisCore.tsx';
import { UltronAgent } from './components/UltronAgent.tsx';
import { FridayAutomation } from './components/FridayAutomation.tsx';
import { KarenMentor } from './components/KarenMentor.tsx';
import { EdithDashboard } from './components/EdithDashboard.tsx';
import { CommandPalette } from './components/CommandPalette.tsx';
import { api, getAuthToken } from './utils/api.ts';

type ViewState = 'LANDING' | 'AUTH' | 'WORKSPACE';
type SystemMode = 'JARVIS' | 'ULTRON' | 'FRIDAY' | 'KAREN' | 'EDITH';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('LANDING');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [currentSystem, setCurrentSystem] = useState<SystemMode>('JARVIS');
  const [activeTab, setActiveTab] = useState('chat');
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [insightsTrigger, setInsightsTrigger] = useState(0);

  // Sync session on mount
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      api.auth.me().then(res => {
        setProjectId(res.defaultProjectId);
        setView('WORKSPACE');
      }).catch(() => {
        setView('LANDING');
      });
    }
  }, []);

  // Listen to keyboard shortcuts
  useEffect(() => {
    const handleShortcuts = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsPaletteOpen(prev => !prev);
      }
      // Ctrl/Cmd + N
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleCreateConversation();
      }
    };
    window.addEventListener('keydown', handleShortcuts);
    return () => window.removeEventListener('keydown', handleShortcuts);
  }, [projectId]);

  // Load conversations when entering workspace
  useEffect(() => {
    if (view === 'WORKSPACE' && projectId) {
      loadConversations();
    }
  }, [view, projectId]);

  // Load messages when active channel changes
  useEffect(() => {
    if (activeConvId) {
      loadMessages(activeConvId);
    }
  }, [activeConvId]);

  const loadConversations = async () => {
    if (!projectId) return;
    try {
      const list = await api.chat.list(projectId);
      setConversations(list);
      if (list.length > 0) {
        // Find if activeConvId still exists, otherwise set first
        const exists = list.find((c: any) => c.id === activeConvId);
        if (!exists) {
          setActiveConvId(list[0].id);
          setCurrentSystem(list[0].systemMode as SystemMode);
        }
      } else {
        // Initialize a default chat thread
        handleCreateConversation();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const list = await api.chat.getMessages(convId);
      setMessages(list);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateConversation = async () => {
    if (!projectId) return;
    try {
      const conv = await api.chat.create({
        title: `Evolution ${currentSystem} Channel`,
        systemMode: currentSystem,
        projectId
      });
      setActiveConvId(conv.id);
      loadConversations();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSwitchSystem = async (mode: SystemMode) => {
    setCurrentSystem(mode);
    if (activeConvId) {
      // Create new conversation on switch to keep context clean
      try {
        const conv = await api.chat.create({
          title: `Evolution ${mode} Channel`,
          systemMode: mode,
          projectId
        });
        setActiveConvId(conv.id);
        loadConversations();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleAddUserMessage = (msg: any) => {
    setMessages(prev => [...prev, msg]);
  };

  const handleUpdateAssistantMessage = (content: string, metadata: any) => {
    setMessages(prev => {
      const newMsgs = [...prev];
      const last = newMsgs[newMsgs.length - 1];
      
      const citations = metadata?.sources || [];
      const freshness = metadata?.liveSearch ? { lastChecked: metadata.timestamp, source: 'Web Search', status: 'CURRENT' } : undefined;

      if (last && last.role === 'assistant') {
        last.content = content;
        if (citations.length > 0) last.citations = citations;
        if (freshness) last.freshness = freshness;
      } else {
        newMsgs.push({
          id: Math.random().toString(),
          role: 'assistant',
          content,
          citations,
          freshness
        });
      }
      return newMsgs;
    });
  };

  const handleFinishStream = () => {
    if (activeConvId) {
      loadConversations();
      loadMessages(activeConvId);
      setInsightsTrigger(prev => prev + 1);
    }
  };

  const handleLogout = () => {
    setView('LANDING');
    setProjectId(null);
    setConversations([]);
    setActiveConvId(null);
    setMessages([]);
  };

  const activeConv = conversations.find(c => c.id === activeConvId);
  const activeConvTitle = activeConv ? activeConv.title : 'Active Core Operations';

  return (
    <div className="h-screen w-screen bg-[#030712] overflow-hidden flex flex-col relative text-gray-100 font-mono">
      {/* Dynamic view rendering */}
      {view === 'LANDING' && (
        <LandingPage onEnter={() => setView('AUTH')} />
      )}

      {view === 'AUTH' && (
        <Auth onSuccess={(pid) => { setProjectId(pid); setView('WORKSPACE'); }} />
      )}

      {view === 'WORKSPACE' && projectId && (
        <div className="flex-1 flex overflow-hidden">
          {/* Collapsible Left Sidebar */}
          <Sidebar
            currentSystem={currentSystem}
            onChangeSystem={handleSwitchSystem}
            activeTab={activeTab}
            onChangeTab={setActiveTab}
            conversations={conversations}
            activeConvId={activeConvId}
            onSelectConv={setActiveConvId}
            onCreateConv={handleCreateConversation}
            onLogout={handleLogout}
          />

          {/* Central Workspace (switchable modes) */}
          <div className="flex-1 flex flex-col min-w-0 h-full">
            {currentSystem === 'JARVIS' && (
              <JarvisCore
                currentSystem={currentSystem}
                projectId={projectId}
                conversationId={activeConvId}
                messages={messages}
                onAddUserMessage={handleAddUserMessage}
                onUpdateAssistantMessage={handleUpdateAssistantMessage}
                onFinishStream={handleFinishStream}
                activeConvTitle={activeConvTitle}
              />
            )}

            {currentSystem === 'ULTRON' && (
              <UltronAgent
                projectId={projectId}
                conversationId={activeConvId}
              />
            )}

            {currentSystem === 'FRIDAY' && (
              <FridayAutomation />
            )}

            {currentSystem === 'KAREN' && (
              <KarenMentor />
            )}

            {currentSystem === 'EDITH' && (
              <EdithDashboard projectId={projectId} />
            )}
          </div>

          {/* Right Observability and Knowledge Ingest Panel */}
          <RightPanel 
            currentSystem={currentSystem} 
            projectId={projectId} 
            onRefreshInsights={() => setInsightsTrigger(prev => prev + 1)}
          />

          {/* Global Search Command Palette overlay */}
          <CommandPalette
            isOpen={isPaletteOpen}
            onClose={() => setIsPaletteOpen(false)}
            onNewChat={handleCreateConversation}
            onSwitchSystem={handleSwitchSystem}
            onChangeTab={setActiveTab}
          />
        </div>
      )}
    </div>
  );
};

export default App;
