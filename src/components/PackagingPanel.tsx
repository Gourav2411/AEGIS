import React from 'react';
import { motion } from 'motion/react';
import { Package, Thermometer, ShieldCheck, Globe, RefreshCw, Box, Layers, CheckCircle2 } from 'lucide-react';
import { PackagingResult } from '../services/geminiService';

interface PackagingPanelProps {
  result: PackagingResult;
  onReset: () => void;
}

export default function PackagingPanel({ result, onReset }: PackagingPanelProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="h-full flex flex-col font-mono"
    >
      <div className="mb-6 border-b border-cyan-900/50 pb-4 flex justify-between items-end">
        <div>
          <h2 className="text-xl text-neon-cyan uppercase tracking-widest flex items-center gap-2">
            <Package className="w-5 h-5" />
            Logistics & Packaging
          </h2>
          <p className="text-sm text-cyan-500/70 mt-2">Supply chain and distribution protocols finalized.</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-cyan-500/70 uppercase tracking-widest">Status</div>
          <div className="text-lg text-neon-green font-bold tracking-widest">READY FOR MFG</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-6">
        
        {/* Physical Packaging */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-4 flex flex-col items-center text-center">
            <Box className="w-8 h-8 text-cyan-400 mb-3" />
            <h3 className="text-[10px] text-cyan-500/70 uppercase tracking-widest mb-1">Vial Type</h3>
            <p className="text-sm text-cyan-100 font-bold">{result.vialType}</p>
          </div>
          
          <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-4 flex flex-col items-center text-center">
            <Layers className="w-8 h-8 text-cyan-400 mb-3" />
            <h3 className="text-[10px] text-cyan-500/70 uppercase tracking-widest mb-1">Stopper Type</h3>
            <p className="text-sm text-cyan-100 font-bold">{result.stopperType}</p>
          </div>

          <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-4 flex flex-col items-center text-center">
            <ShieldCheck className="w-8 h-8 text-cyan-400 mb-3" />
            <h3 className="text-[10px] text-cyan-500/70 uppercase tracking-widest mb-1">Seal Type</h3>
            <p className="text-sm text-cyan-100 font-bold">{result.sealType}</p>
          </div>
        </div>

        {/* Packaging Details */}
        <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-4 space-y-4">
          <div>
            <h3 className="text-xs text-cyan-500/70 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Package className="w-4 h-4" /> Primary Packaging
            </h3>
            <p className="text-sm text-cyan-100 leading-relaxed">{result.primaryPackaging}</p>
          </div>
          <div className="border-t border-cyan-900/30 pt-4">
            <h3 className="text-xs text-cyan-500/70 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Box className="w-4 h-4" /> Secondary Packaging
            </h3>
            <p className="text-sm text-cyan-100 leading-relaxed">{result.secondaryPackaging}</p>
          </div>
        </div>

        {/* Temperature & Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-4">
            <h3 className="text-xs text-cyan-500/70 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-red-400" /> Temperature Control
            </h3>
            <p className="text-sm text-cyan-100 leading-relaxed">{result.temperatureControl}</p>
          </div>

          <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-4">
            <h3 className="text-xs text-cyan-500/70 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" /> Distribution Plan
            </h3>
            <p className="text-sm text-cyan-100 leading-relaxed">{result.distributionPlan}</p>
          </div>
        </div>

      </div>

      <div className="mt-6 pt-6 border-t border-cyan-900/50 flex justify-between items-center">
        <button 
          onClick={onReset}
          className="px-4 py-2 text-xs text-cyan-500/70 hover:text-cyan-100 uppercase tracking-widest flex items-center gap-2 transition-colors"
        >
          <RefreshCw className="w-3 h-3" /> Initialize New Protocol
        </button>
        
        <button 
          className="group relative px-6 py-3 bg-neon-green/20 border border-neon-green text-neon-green text-sm uppercase tracking-widest hover:bg-neon-green hover:text-jarvis-bg transition-all overflow-hidden"
        >
          <div className="absolute inset-0 bg-neon-green/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
          <span className="relative flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Deploy to Manufacturing
          </span>
        </button>
      </div>
    </motion.div>
  );
}
