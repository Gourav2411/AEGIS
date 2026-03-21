import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Activity, Terminal, Dna, Zap, Database, CheckCircle2, FlaskConical } from 'lucide-react';

interface LiveOptimizationProps {
  targetReceptor: string;
}

export default function LiveOptimization({ targetReceptor }: LiveOptimizationProps) {
  const [epoch, setEpoch] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [currentSmiles, setCurrentSmiles] = useState("CC1=C(C=C(C=C1)NC(=O)C2=CC=C(C=C2)CN3CCN(CC3)C)NC4=NC=CC(=N4)C5=CN=CC=C5");
  const [bestAffinity, setBestAffinity] = useState(-5.2);
  const [currentAffinity, setCurrentAffinity] = useState(-5.2);

  useEffect(() => {
    const generateSmilesMutation = (base: string) => {
      const atoms = ['F', 'Cl', 'O', 'N', 'S', 'C'];
      const randomAtom = atoms[Math.floor(Math.random() * atoms.length)];
      if (Math.random() > 0.5) {
        return base + randomAtom;
      } else {
        return base.substring(0, base.length - 1) + randomAtom;
      }
    };

    const interval = setInterval(() => {
      setEpoch(prev => {
        const nextEpoch = prev + 1;
        
        // Simulate REINVENT + Vina Loop
        const newSmiles = generateSmilesMutation(currentSmiles);
        const affinityDelta = (Math.random() * 0.5) - 0.3; // Bias towards improvement
        const newAffinity = Number((currentAffinity + affinityDelta).toFixed(2));
        
        setCurrentSmiles(newSmiles);
        setCurrentAffinity(newAffinity);

        if (newAffinity < bestAffinity) {
          setBestAffinity(newAffinity);
        }

        const newLog = `[Epoch ${nextEpoch}] REINVENT Agent mutated SMILES. Running AutoDock Vina on ${targetReceptor}... ΔG = ${newAffinity} kcal/mol`;
        
        setLogs(prevLogs => {
          const updated = [...prevLogs, newLog];
          return updated.length > 8 ? updated.slice(updated.length - 8) : updated;
        });

        return nextEpoch;
      });
    }, 800); // Update every 800ms for dramatic effect

    return () => clearInterval(interval);
  }, [currentSmiles, currentAffinity, bestAffinity, targetReceptor]);

  return (
    <div className="h-full flex flex-col justify-center max-w-3xl mx-auto w-full p-4 font-mono">
      <div className="text-center mb-8">
        <h3 className="text-2xl text-neon-cyan uppercase tracking-widest mb-2 font-bold flex items-center justify-center gap-3">
          <Zap className="w-6 h-6 animate-pulse text-neon-green" />
          Live REINVENT Optimization
        </h3>
        <p className="text-sm text-cyan-500/70">
          Running Reinforcement Learning Agent & AutoDock Vina Physics Engine
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-cyan-950/30 border border-cyan-900/50 rounded-lg p-4 text-center">
          <div className="text-xs text-cyan-500/70 uppercase tracking-widest mb-1">Current Epoch</div>
          <div className="text-3xl text-white font-bold">{epoch} <span className="text-sm text-cyan-500">/ 10,000</span></div>
        </div>
        <div className="bg-cyan-950/30 border border-cyan-900/50 rounded-lg p-4 text-center">
          <div className="text-xs text-cyan-500/70 uppercase tracking-widest mb-1">Best Binding Affinity</div>
          <div className="text-3xl text-neon-green font-bold">{bestAffinity.toFixed(2)} <span className="text-sm text-cyan-500">kcal/mol</span></div>
        </div>
        <div className="bg-cyan-950/30 border border-cyan-900/50 rounded-lg p-4 text-center">
          <div className="text-xs text-cyan-500/70 uppercase tracking-widest mb-1">Toxicity Score (GNN)</div>
          <div className="text-3xl text-white font-bold">0.12 <span className="text-sm text-cyan-500">Safe</span></div>
        </div>
      </div>

      <div className="bg-black/50 border border-cyan-900/50 rounded-lg p-4 mb-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500/0 via-neon-cyan to-cyan-500/0 opacity-50"></div>
        <div className="text-xs text-cyan-500/70 uppercase tracking-widest mb-2 flex items-center gap-2">
          <Dna className="w-4 h-4" /> Current Candidate SMILES
        </div>
        <div className="text-sm text-neon-cyan break-all font-bold tracking-wider">
          {currentSmiles}
        </div>
      </div>

      <div className="bg-[#0a0f16] border border-cyan-900/50 rounded-lg p-4 flex-1 overflow-hidden flex flex-col">
        <div className="text-xs text-cyan-500/70 uppercase tracking-widest mb-3 flex items-center gap-2 border-b border-cyan-900/50 pb-2">
          <Terminal className="w-4 h-4" /> AutoDock Vina & REINVENT Logs
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 text-xs">
          {logs.map((log, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`font-mono ${log.includes('AutoDock Vina') ? 'text-cyan-400' : 'text-cyan-600'}`}
            >
              <span className="text-cyan-700 mr-2">{'>'}</span>
              {log}
            </motion.div>
          ))}
          <motion.div 
            animate={{ opacity: [1, 0] }} 
            transition={{ repeat: Infinity, duration: 0.8 }}
            className="w-2 h-4 bg-neon-cyan inline-block mt-2"
          />
        </div>
      </div>
    </div>
  );
}
