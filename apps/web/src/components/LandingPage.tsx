import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Brain, Cpu, GraduationCap, Command } from 'lucide-react';

interface LandingPageProps {
  onEnter: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const nodes = [
    { id: 'JARVIS', name: 'J.A.R.V.I.S.', icon: Shield, color: 'text-jarvis', bg: 'border-jarvis/30 bg-jarvis/5', glow: 'shadow-hud-jarvis', desc: 'The default assistant capability. Polished general dialog, search, and coding tasks.' },
    { id: 'ULTRON', name: 'ULTRON', icon: Brain, color: 'text-ultron', bg: 'border-ultron/30 bg-ultron/5', glow: 'shadow-hud-ultron', desc: 'Advanced autonomous agent engine. Solves multi-step objectives with logical trees.' },
    { id: 'FRIDAY', name: 'F.R.I.D.A.Y.', icon: Cpu, color: 'text-friday', bg: 'border-friday/30 bg-friday/5', glow: 'shadow-hud-friday', desc: 'The successor workflow engine. Triggers API webhooks and schedules task chains.' },
    { id: 'KAREN', name: 'K.A.R.E.N.', icon: GraduationCap, color: 'text-karen', bg: 'border-karen/30 bg-karen/5', glow: 'shadow-hud-karen', desc: 'The mentor tutoring system. Dynamic study planners, quizzes, and progression metrics.' },
    { id: 'EDITH', name: 'E.D.I.T.H.', icon: Command, color: 'text-edith', bg: 'border-edith/30 bg-edith/5', glow: 'shadow-hud-edith', desc: 'The legacy command center. Scopes project assets, warnings, and code compliance.' }
  ];

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 relative overflow-y-auto scanlines">
      {/* HUD background grid */}
      <div className="absolute inset-0 bg-cyber-grid pointer-events-none z-0" />
      
      {/* Top Header */}
      <header className="flex justify-between items-center z-10 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full border-2 border-jarvis flex items-center justify-center animate-pulse shadow-hud-jarvis">
            <div className="w-3 h-3 rounded-full bg-jarvis" />
          </div>
          <span className="text-xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-jarvis to-edith">
            AI EVOLUTION
          </span>
        </div>
        <div className="text-xs text-jarvis tracking-widest font-mono opacity-80">
          SYS STATUS: ONLINE
        </div>
      </header>

      {/* Main Hero & AI Core */}
      <main className="flex-1 flex flex-col justify-center items-center my-4 z-10">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-center max-w-4xl"
        >
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tighter mb-2 text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 uppercase font-mono">
            Never Build Just One AI.
          </h1>
          <p className="text-lg md:text-xl text-jarvis font-mono glow-text-jarvis uppercase tracking-widest mb-6">
            Build What Comes Next.
          </p>
        </motion.div>

        {/* Central Pulsing HUD Core (Resized) */}
        <div className="relative w-40 h-40 md:w-48 md:h-48 flex items-center justify-center my-4">
          {/* Animated concentric rings */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
            className="absolute inset-0 rounded-full border border-dashed border-jarvis/30 scale-95"
          />
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 18, ease: "linear" }}
            className="absolute inset-2 rounded-full border border-double border-edith/20 scale-90"
          />
          <motion.div 
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="absolute inset-6 rounded-full border border-karen/20 shadow-inner flex items-center justify-center bg-cyber-bg/40 backdrop-blur-md"
          />
          
          {/* Inner core circle */}
          <div className="w-16 h-16 rounded-full bg-cyber-bg border border-jarvis flex items-center justify-center shadow-hud-jarvis">
            <motion.div 
              animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              className="w-8 h-8 rounded-full bg-jarvis flex items-center justify-center"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-cyber-bg" />
            </motion.div>
          </div>
        </div>

        {/* Enter workspace button (Moved above timeline for instant visibility) */}
        <motion.button
          whileHover={{ scale: 1.03, boxShadow: '0 0 20px rgba(0, 210, 255, 0.5)' }}
          whileTap={{ scale: 0.98 }}
          onClick={onEnter}
          className="my-4 px-8 py-3 bg-transparent border-2 border-jarvis text-jarvis text-sm font-bold tracking-widest font-mono rounded shadow-hud-jarvis uppercase hover:bg-jarvis hover:text-cyber-bg transition-colors z-20"
        >
          Initialize AI Workspace
        </motion.button>

        {/* Cinematic Evolution Timeline */}
        <div className="w-full max-w-5xl mt-2">
          <div className="relative py-2">
            {/* Connection Line */}
            <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-gradient-to-r from-jarvis/30 via-friday/30 to-edith/30 -translate-y-1/2 hidden md:block" />
            
            {/* Timeline nodes */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 relative">
              {nodes.map((node, index) => {
                const Icon = node.icon;
                return (
                  <motion.div
                    key={node.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.15, duration: 0.6 }}
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                    className={`hud-glass border rounded-xl p-3 flex flex-col items-center text-center cursor-pointer transition-all duration-300 relative group hover:border-jarvis ${node.bg} ${node.glow}`}
                  >
                    {/* Badge Index */}
                    <span className="absolute top-1.5 left-2 text-[9px] font-mono text-gray-500">0{index + 1}</span>
                    
                    <div className={`p-2 rounded-full border border-gray-800 mb-2 group-hover:scale-110 transition-transform ${node.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    
                    <h3 className="font-bold font-mono tracking-widest text-xs mb-0.5 text-white">
                      {node.name}
                    </h3>
                    
                    <p className="text-[10px] text-gray-400 font-mono line-clamp-2">
                      {node.desc}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex justify-between items-center text-[10px] text-gray-500 font-mono tracking-widest uppercase border-t border-gray-900 pt-4 z-10">
        <div>ORBITAL OS V1.0.8</div>
        <div>PRODUCED BY ANTIGRAVITY</div>
        <div>SECURE ACCESS GRANTED</div>
      </footer>
    </div>
  );
};
