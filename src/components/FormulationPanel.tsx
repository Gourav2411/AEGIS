import React from 'react';
import { motion } from 'motion/react';
import { Beaker, Activity, Dna, Database, RefreshCw, ChevronRight } from 'lucide-react';
import { FormulationResult } from '../services/geminiService';

interface FormulationPanelProps {
  result: FormulationResult;
  onNext: () => void;
  onReset: () => void;
  loading: boolean;
}

export default function FormulationPanel({ result, onNext, onReset, loading }: FormulationPanelProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="h-full flex flex-col font-mono"
    >
      <div className="mb-6 border-b border-cyan-900/50 pb-4 flex justify-between items-end">
        <div>
          <h2 className="text-xl text-neon-cyan uppercase tracking-widest flex items-center gap-2">
            <Beaker className="w-5 h-5" />
            Synthesis Complete
          </h2>
          <p className="text-sm text-cyan-500/70 mt-2">Novel molecular structure generated successfully.</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-cyan-500/70 uppercase tracking-widest">Compound ID</div>
          <div className="text-lg text-neon-green font-bold tracking-widest">{result.compoundId}</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-6">
        
        {/* Formulation Name */}
        <div className="bg-neon-cyan/10 border border-neon-cyan/50 rounded-lg p-4 flex items-center justify-between">
          <div>
            <h3 className="text-xs text-neon-cyan uppercase tracking-widest mb-1">Generated Formulation Name</h3>
            <p className="text-2xl text-white font-bold tracking-wider">{result.name}</p>
          </div>
          <div className="hidden md:block text-neon-cyan/30">
            <Beaker className="w-12 h-12" />
          </div>
        </div>

        {/* Mechanism of Action */}
        <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-4">
          <h3 className="text-xs text-cyan-500/70 uppercase tracking-widest mb-2 flex items-center gap-2">
            <Activity className="w-4 h-4" /> Mechanism of Action
          </h3>
          <p className="text-sm text-cyan-100 leading-relaxed">{result.mechanismOfAction}</p>
        </div>

        {/* Active Ingredients */}
        <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-4">
          <h3 className="text-xs text-cyan-500/70 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Dna className="w-4 h-4" /> Active Synthetic Ingredients
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {result.activeIngredients.map((ingredient, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-cyan-100 bg-jarvis-bg border border-cyan-900/30 p-2 rounded">
                <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan"></div>
                {ingredient}
              </div>
            ))}
          </div>
        </div>

        {/* Closest Medicines */}
        <div>
          <h3 className="text-xs text-cyan-500/70 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Database className="w-4 h-4" /> Global Market Analysis (Closest Matches)
          </h3>
          <div className="space-y-3">
            {result.closestMedicines.map((med, idx) => (
              <div key={idx} className="bg-jarvis-bg border border-cyan-900/50 rounded-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-neon-cyan/50 transition-colors">
                <div>
                  <div className="text-sm font-bold text-cyan-100 uppercase tracking-wider">{med.name}</div>
                  <div className="text-xs text-cyan-500/70 mt-1">{med.manufacturer}</div>
                </div>
                
                <div className="flex gap-6 text-right">
                  <div>
                    <div className="text-[10px] text-cyan-500/50 uppercase tracking-widest">Similarity</div>
                    <div className="text-sm text-neon-green">{med.similarityScore}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-cyan-500/50 uppercase tracking-widest">Est. Price</div>
                    <div className="text-sm text-cyan-100">{med.priceEstimate}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-cyan-900/50 flex justify-between items-center">
        <button 
          onClick={onReset}
          disabled={loading}
          className="px-4 py-2 text-xs text-cyan-500/70 hover:text-cyan-100 uppercase tracking-widest flex items-center gap-2 transition-colors"
        >
          <RefreshCw className="w-3 h-3" /> Abort & Restart
        </button>
        
        <button 
          onClick={onNext}
          disabled={loading}
          className="group relative px-6 py-3 bg-cyan-950/50 border border-neon-cyan text-neon-cyan text-sm uppercase tracking-widest hover:bg-neon-cyan hover:text-jarvis-bg transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
        >
          <div className="absolute inset-0 bg-neon-cyan/20 translate-x-full group-hover:translate-x-0 transition-transform"></div>
          <span className="relative flex items-center gap-2">
            {loading ? 'Simulating...' : 'Run Virtual Trials'}
            <ChevronRight className="w-4 h-4" />
          </span>
        </button>
      </div>
    </motion.div>
  );
}
