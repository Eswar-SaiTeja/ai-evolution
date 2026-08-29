import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, Volume2, VolumeX, Square, RefreshCw, Copy, Share2, Paperclip, Search, Sparkles } from 'lucide-react';
import { api } from '../utils/api.js';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: { title: string; url: string; snippet: string }[];
  freshness?: { lastChecked: string; source: string; status: string };
  createdAt?: string;
}

interface JarvisCoreProps {
  currentSystem: string;
  projectId: string;
  conversationId: string | null;
  messages: Message[];
  onAddUserMessage: (msg: Message) => void;
  onUpdateAssistantMessage: (content: string, metadata: any) => void;
  onFinishStream: () => void;
  activeConvTitle: string;
}

export const JarvisCore: React.FC<JarvisCoreProps> = ({
  currentSystem,
  projectId,
  conversationId,
  messages,
  onAddUserMessage,
  onUpdateAssistantMessage,
  onFinishStream,
  activeConvTitle
}) => {
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'READY' | 'THINKING' | 'SEARCHING' | 'GENERATING'>('READY');
  const [voiceMode, setVoiceMode] = useState(false);
  const [speechActive, setSpeechActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [liveSearchActive, setLiveSearchActive] = useState(false);
  const [freshnessStamp, setFreshnessStamp] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || !conversationId) return;

    if (!textToSend) setInput('');
    
    // Add user message locally
    const userMsgId = Math.random().toString();
    onAddUserMessage({ id: userMsgId, role: 'user', content: text });
    
    setStatus('THINKING');
    setLiveSearchActive(false);
    setFreshnessStamp(null);
    
    let accumulatedText = '';
    let hasMetadata = false;

    // Trigger SSE Stream
    await api.chat.stream(
      {
        conversationId,
        query: text,
        overrideMode: currentSystem,
        projectId
      },
      (chunk) => {
        setStatus('GENERATING');
        accumulatedText += chunk;
        onUpdateAssistantMessage(accumulatedText, null);
      },
      (metadata) => {
        hasMetadata = true;
        if (metadata.liveSearch) {
          setStatus('SEARCHING');
          setLiveSearchActive(true);
        }
        if (metadata.timestamp) {
          setFreshnessStamp(metadata.timestamp);
        }
        // Push citations if available
        onUpdateAssistantMessage(accumulatedText, metadata);
      },
      (err) => {
        console.error(err);
        setStatus('READY');
      }
    );

    setStatus('READY');
    onFinishStream();

    // Browser-native Text to Speech (TTS) if sound is toggled and we are in Voice Mode
    if (soundEnabled && accumulatedText) {
      speakResponse(accumulatedText);
    }
  };

  const speakResponse = (text: string) => {
    if (!synthRef.current) return;
    
    synthRef.current.cancel();
    
    // Strip markdown formatting for cleaner speech
    const cleanText = text.replace(/[*#`_\-]/g, '').replace(/\[.*?\]\(.*?\)/g, '');
    
    const utterance = new SpeechSynthesisUtterance(cleanText.slice(0, 300) + '...');
    utterance.onstart = () => setSpeechActive(true);
    utterance.onend = () => setSpeechActive(false);
    utterance.onerror = () => setSpeechActive(false);
    
    speechUtteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  };

  const handleStopSpeech = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setSpeechActive(false);
    }
  };

  const handleMicClick = () => {
    if (speechActive) {
      handleStopSpeech();
      return;
    }
    setVoiceMode(!voiceMode);
  };

  // Mock voice input
  const triggerVoiceSpeechInput = () => {
    const mockSpeeches = [
      "Explain the differences between REST and GraphQL",
      "Show active project insights overview",
      "Explain React 19 server actions",
      "Teach me Python loops step by step"
    ];
    const picked = mockSpeeches[Math.floor(Math.random() * mockSpeeches.length)];
    setVoiceMode(false);
    setInput(picked);
    handleSend(picked);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Color mappings
  const systemAccents = {
    JARVIS: { ring: 'border-jarvis/30', core: 'bg-jarvis shadow-hud-jarvis', text: 'text-jarvis glow-text-jarvis' },
    ULTRON: { ring: 'border-ultron/30', core: 'bg-ultron shadow-hud-ultron', text: 'text-ultron glow-text-ultron' },
    FRIDAY: { ring: 'border-friday/30', core: 'bg-friday shadow-hud-friday', text: 'text-friday glow-text-friday' },
    KAREN: { ring: 'border-karen/30', core: 'bg-karen shadow-hud-karen', text: 'text-karen glow-text-karen' },
    EDITH: { ring: 'border-edith/30', core: 'bg-edith shadow-hud-edith', text: 'text-edith glow-text-edith' }
  }[currentSystem] || { ring: 'border-jarvis/30', core: 'bg-jarvis shadow-hud-jarvis', text: 'text-jarvis glow-text-jarvis' };

  return (
    <div className="flex-1 flex flex-col h-full bg-cyber-bg relative min-w-0">
      {/* Background Canvas Particles */}
      <div className="absolute inset-0 bg-cyber-grid pointer-events-none" />

      {/* Workspace Header */}
      <div className="p-4 border-b border-gray-900 flex justify-between items-center z-10">
        <div>
          <h2 className="text-sm font-bold tracking-widest text-white uppercase">{activeConvTitle}</h2>
          <div className="text-[10px] text-gray-500 uppercase mt-0.5 tracking-wider font-mono">
            OPERATIONAL CHANNEL — {currentSystem} MODE ACTIVE
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)} 
            title={soundEnabled ? "Mute responses" : "Enable voice TTS"}
            className="text-gray-500 hover:text-white"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <div className="flex items-center gap-1.5 border border-gray-800 rounded px-2.5 py-1 bg-cyber-bg/50">
            <span className={`w-2 h-2 rounded-full ${status === 'READY' ? 'bg-karen' : 'bg-friday animate-ping'}`} />
            <span className="text-[9px] font-mono tracking-widest text-gray-400 font-bold uppercase">{status}</span>
          </div>
        </div>
      </div>

      {/* Main Dialogue panel */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 z-10">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((msg, i) => (
            <div
              key={msg.id || i}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              {/* Message box */}
              <div 
                className={`max-w-2xl p-4 rounded border font-mono text-xs leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'border-gray-800 bg-[#0f1530]/40 text-gray-200'
                    : 'hud-glass text-white'
                }`}
              >
                {/* Mode identity tag for assistant */}
                {msg.role === 'assistant' && (
                  <div className="text-[9px] uppercase tracking-widest text-gray-500 mb-2 border-b border-gray-900 pb-1">
                    System Response (Calculated output)
                  </div>
                )}
                {msg.content}
                
                {/* Citation references cards */}
                {msg.role === 'assistant' && msg.citations && msg.citations.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-900 space-y-1.5">
                    <span className="text-[9px] uppercase tracking-widest text-gray-500 flex items-center gap-1 font-bold">
                      <Search className="w-3 h-3 text-jarvis" />
                      Source References
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                      {msg.citations.map((c, idx) => (
                        <a
                          key={idx}
                          href={c.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 border border-gray-900 rounded bg-[#030712]/40 hover:border-jarvis/30 hover:bg-[#030712] transition-colors block text-[10px]"
                        >
                          <div className="font-bold text-jarvis truncate uppercase">{c.title || 'Web Resource'}</div>
                          <div className="text-[9px] text-gray-500 truncate mt-0.5">{c.url}</div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Freshness Timestamp info */}
                {msg.role === 'assistant' && msg.freshness && (
                  <div className="mt-3 text-[9px] font-mono text-karen uppercase tracking-widest flex items-center gap-1 font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    Last updated: {msg.freshness.lastChecked} ({msg.freshness.source}) — FRESHNESS: {msg.freshness.status}
                  </div>
                )}
              </div>

              {/* Action links */}
              <div className="flex gap-2.5 mt-1 px-1 text-[9px] font-mono text-gray-500">
                <button onClick={() => handleCopy(msg.content)} className="hover:text-white flex items-center gap-0.5">
                  <Copy className="w-3 h-3" /> Copy
                </button>
                {msg.role === 'assistant' && (
                  <button className="hover:text-white flex items-center gap-0.5">
                    <Share2 className="w-3 h-3" /> Share
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {status !== 'READY' && (
            <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase font-mono animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-friday animate-ping" />
              AI is computing results...
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Voice Mode Overlay */}
      <AnimatePresence>
        {voiceMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-cyber-bg/95 backdrop-blur-md flex flex-col justify-center items-center z-30 font-mono"
          >
            <div className="text-center max-w-sm px-6">
              <div className="text-[10px] text-jarvis uppercase tracking-widest font-bold mb-8">
                VOICE AI ASSISTANT RUN
              </div>
              
              {/* Large breathing pulsing core */}
              <div className="relative w-48 h-48 flex items-center justify-center mx-auto mb-10">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-full border-2 border-jarvis/30"
                />
                <motion.div
                  animate={{ scale: [1, 1.35, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                  className="absolute inset-4 rounded-full border border-jarvis"
                />
                <div 
                  onClick={triggerVoiceSpeechInput}
                  className="w-24 h-24 rounded-full bg-cyber-bg border-2 border-jarvis flex items-center justify-center cursor-pointer shadow-hud-jarvis group hover:bg-jarvis transition-colors"
                >
                  <Mic className="w-8 h-8 text-jarvis group-hover:text-cyber-bg" />
                </div>
              </div>

              <div className="text-sm font-bold text-white mb-2 uppercase">LISTENING...</div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide leading-relaxed">
                Click core button to simulate voice prompt reception, or click bottom button to abort voice stream.
              </p>

              <button
                onClick={() => setVoiceMode(false)}
                className="mt-8 px-6 py-2 border border-gray-800 hover:border-white text-gray-400 hover:text-white rounded uppercase text-xs"
              >
                Cancel Voice Mode
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input panel */}
      <div className="p-4 border-t border-gray-900 bg-cyber-bg/70 z-10">
        <div className="max-w-3xl mx-auto">
          {/* Freshness banner */}
          {freshnessStamp && (
            <div className="mb-2 text-[9.5px] font-mono text-karen uppercase tracking-widest flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-karen" />
              Live knowledge retrieval completed: {freshnessStamp} (Sources citation updated)
            </div>
          )}

          <div className="flex items-center gap-2 border border-gray-800 rounded bg-[#060a16] p-2 focus-within:border-jarvis/50 transition-all shadow-inner">
            <button className="text-gray-500 hover:text-gray-300 p-1.5" title="Upload files (PDF, DOCX, TXT)">
              <Paperclip className="w-4 h-4" />
            </button>
            
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask anything, type prompt or speak..."
              rows={1}
              className="flex-1 bg-transparent text-white font-mono text-xs focus:outline-none resize-none max-h-24 py-1.5"
            />
            
            {status !== 'READY' ? (
              <button 
                onClick={() => setStatus('READY')}
                className="text-friday hover:text-red-400 p-1.5" 
                title="Stop generation"
              >
                <Square className="w-4 h-4 animate-pulse" />
              </button>
            ) : (
              <>
                <button 
                  onClick={handleMicClick}
                  className="text-gray-500 hover:text-jarvis p-1.5 transition-colors" 
                  title="Voice input mode"
                >
                  <Mic className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleSend()}
                  disabled={!input.trim()}
                  className="p-1.5 bg-jarvis/10 hover:bg-jarvis border border-jarvis/30 text-jarvis hover:text-cyber-bg rounded transition-all disabled:opacity-30 disabled:hover:bg-jarvis/10 disabled:hover:text-jarvis"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
