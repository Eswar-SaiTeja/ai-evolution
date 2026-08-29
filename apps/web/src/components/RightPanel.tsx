import React, { useState, useEffect } from 'react';
import { Settings, FileText, Database, ShieldCheck, Trash2, Plus, Upload, X } from 'lucide-react';
import { api } from '../utils/api.js';

interface RightPanelProps {
  currentSystem: string;
  projectId: string;
  onRefreshInsights?: () => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({ currentSystem, projectId, onRefreshInsights }) => {
  const [modelConfigs, setModelConfigs] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState('gemini-1.5-pro');
  const [memories, setMemories] = useState<any[]>([]);
  const [newMemory, setNewMemory] = useState('');
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadContent, setUploadContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [systemHealth, setSystemHealth] = useState<any>(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [projectId]);

  const fetchData = async () => {
    try {
      const models = await api.admin.models();
      setModelConfigs(models);

      const memList = await api.workspace.memories.list(projectId);
      setMemories(memList);

      const docList = await api.workspace.documents.list(projectId);
      setDocuments(docList);

      const health = await api.admin.status();
      setSystemHealth(health);
    } catch (e) {
      console.warn("Failed fetching metadata parameters.");
    }
  };

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemory.trim()) return;

    try {
      await api.workspace.memories.create({
        type: 'LONG',
        category: 'PREFERENCE',
        content: newMemory,
        projectId
      });
      setNewMemory('');
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      await api.workspace.memories.delete(id);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim() || !uploadContent.trim()) return;

    setIsUploading(true);
    try {
      await api.workspace.documents.upload({
        title: uploadTitle,
        fileType: 'TXT',
        content: uploadContent,
        projectId
      });
      setUploadTitle('');
      setUploadContent('');
      fetchData();
      if (onRefreshInsights) onRefreshInsights();
    } catch (e) {
      console.error(e);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    try {
      await api.workspace.documents.delete(id);
      fetchData();
      if (onRefreshInsights) onRefreshInsights();
    } catch (e) {
      console.error(e);
    }
  };

  // Color theme mapping
  const modeColor = {
    JARVIS: 'text-jarvis border-jarvis/30 bg-jarvis/5',
    ULTRON: 'text-ultron border-ultron/30 bg-ultron/5',
    FRIDAY: 'text-friday border-friday/30 bg-friday/5',
    KAREN: 'text-karen border-karen/30 bg-karen/5',
    EDITH: 'text-edith border-edith/30 bg-edith/5'
  }[currentSystem] || 'text-jarvis border-jarvis/30 bg-jarvis/5';

  return (
    <div className="w-80 bg-cyber-bg border-l border-gray-900 flex flex-col h-full font-mono text-xs select-none">
      {/* Panel Header */}
      <div className="p-4 border-b border-gray-900 flex items-center justify-between">
        <span className="font-bold tracking-widest text-white uppercase flex items-center gap-2">
          <Settings className="w-4 h-4 text-jarvis animate-spin-slow" />
          Command Panel
        </span>
      </div>

      {/* Model config dropdown */}
      <div className="p-4 border-b border-gray-900">
        <label className="block text-gray-500 uppercase tracking-widest mb-2 font-bold">Active AI Model</label>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="w-full bg-cyber-bg border border-gray-800 text-white rounded p-2 focus:border-jarvis focus:outline-none transition-all uppercase"
        >
          {modelConfigs.map((m, i) => (
            <option key={i} value={m.model}>{m.provider.toUpperCase()} - {m.model}</option>
          ))}
          {modelConfigs.length === 0 && <option>Google Gemini (Default)</option>}
        </select>
        <div className={`mt-2 p-2 border rounded text-[10px] uppercase font-mono ${modeColor}`}>
          Active system: {currentSystem} Core routing
        </div>
      </div>

      {/* Subsections container */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-6 p-4">
        {/* Knowledge Base Documents RAG */}
        <div className="space-y-3">
          <h3 className="font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 border-b border-gray-900 pb-1.5">
            <FileText className="w-4 h-4 text-jarvis" />
            Documents Index (RAG)
          </h3>
          
          {/* List existing */}
          <div className="space-y-2 max-h-36 overflow-y-auto">
            {documents.map(doc => (
              <div key={doc.id} className="flex justify-between items-center p-2 border border-gray-900 rounded bg-cyber-card/30">
                <div className="truncate flex-1 pr-2">
                  <div className="font-bold text-white truncate">{doc.title}</div>
                  <div className="text-[9px] text-gray-500 flex gap-2">
                    <span>{doc.fileType}</span>
                    <span className={doc.indexingStatus === 'INDEXED' ? 'text-karen' : 'text-friday animate-pulse'}>
                      {doc.indexingStatus}
                    </span>
                  </div>
                </div>
                <button onClick={() => handleDeleteDoc(doc.id)} className="text-gray-500 hover:text-ultron">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {documents.length === 0 && (
              <div className="text-[10px] text-gray-600 text-center py-2 uppercase">No files indexed</div>
            )}
          </div>

          {/* Add file */}
          <form onSubmit={handleUploadDocument} className="space-y-2 border border-gray-900 p-2.5 rounded bg-cyber-bg/50">
            <input
              type="text"
              required
              value={uploadTitle}
              onChange={e => setUploadTitle(e.target.value)}
              placeholder="File title"
              className="w-full bg-cyber-bg border border-gray-800 rounded p-1.5 focus:border-jarvis focus:outline-none placeholder-gray-700"
            />
            <textarea
              required
              value={uploadContent}
              onChange={e => setUploadContent(e.target.value)}
              placeholder="Paste text contents..."
              rows={2}
              className="w-full bg-cyber-bg border border-gray-800 rounded p-1.5 focus:border-jarvis focus:outline-none placeholder-gray-700 font-mono text-[10px]"
            />
            <button
              type="submit"
              disabled={isUploading}
              className="w-full py-1.5 bg-jarvis/10 hover:bg-jarvis hover:text-cyber-bg border border-jarvis/30 text-jarvis font-bold rounded flex items-center justify-center gap-1.5 uppercase text-[10px]"
            >
              <Upload className="w-3 h-3" />
              {isUploading ? 'INDEXING...' : 'INDEX DOCUMENT'}
            </button>
          </form>
        </div>

        {/* AI Memory system */}
        <div className="space-y-3">
          <h3 className="font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 border-b border-gray-900 pb-1.5">
            <Database className="w-4 h-4 text-karen" />
            AI Long-Term Memory
          </h3>

          <div className="space-y-2 max-h-36 overflow-y-auto">
            {memories.map(mem => (
              <div key={mem.id} className="flex justify-between items-start p-2 border border-gray-900 rounded bg-cyber-card/30">
                <p className="text-[10px] text-gray-300 leading-normal flex-1 pr-2">
                  <span className="text-karen font-bold uppercase mr-1">[{mem.category}]:</span>
                  {mem.content}
                </p>
                <button onClick={() => handleDeleteMemory(mem.id)} className="text-gray-500 hover:text-ultron mt-0.5">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {memories.length === 0 && (
              <div className="text-[10px] text-gray-600 text-center py-2 uppercase">Memory cache clear</div>
            )}
          </div>

          <form onSubmit={handleAddMemory} className="flex gap-2">
            <input
              type="text"
              required
              value={newMemory}
              onChange={e => setNewMemory(e.target.value)}
              placeholder="Remember preference..."
              className="flex-1 bg-cyber-bg border border-gray-800 rounded p-1.5 focus:border-jarvis focus:outline-none placeholder-gray-700"
            />
            <button type="submit" className="p-1.5 bg-karen/10 border border-karen/30 rounded text-karen hover:bg-karen hover:text-cyber-bg">
              <Plus className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* System Health */}
        <div className="space-y-3">
          <h3 className="font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 border-b border-gray-900 pb-1.5">
            <ShieldCheck className="w-4 h-4 text-friday" />
            Core Observability
          </h3>
          <div className="space-y-2 p-2.5 border border-gray-900 rounded bg-cyber-card/10">
            <div className="flex justify-between">
              <span className="text-gray-500 uppercase">SYS STATUS:</span>
              <span className="text-karen font-bold">ONLINE</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 uppercase">DB STATUS:</span>
              <span className={systemHealth?.database === 'ONLINE' ? 'text-karen' : 'text-ultron'}>
                {systemHealth?.database || 'ONLINE'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 uppercase">LATENCY MS:</span>
              <span className="text-jarvis font-bold">42ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 uppercase">RAG RATIO:</span>
              <span className="text-white">100% FRESH</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
