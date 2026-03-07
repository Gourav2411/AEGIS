import React from 'react';
import { motion } from 'motion/react';
import { Activity, ShieldAlert, HeartPulse, BrainCircuit, RefreshCw, ChevronRight, CheckCircle2, AlertTriangle, Beaker, LineChart, Users, TrendingUp, Dna, Filter, Globe } from 'lucide-react';
import { TrialResult } from '../services/geminiService';

interface TrialPanelProps {
  result: TrialResult;
  onNext: () => void;
  onReset: () => void;
  loading: boolean;
}

export default function TrialPanel({ result, onNext, onReset, loading }: TrialPanelProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-neon-green';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-neon-green';
    if (score >= 50) return 'bg-yellow-400';
    return 'bg-red-500';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="h-full flex flex-col font-mono"
    >
      <div className="mb-6 border-b border-cyan-900/50 pb-4 flex justify-between items-end">
        <div>
          <h2 className="text-xl text-neon-cyan uppercase tracking-widest flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Virtual Trial Simulation
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <Globe className="w-3 h-3 text-neon-green animate-pulse" />
            <p className="text-xs text-neon-green/80 uppercase tracking-widest">Simulated using real-world trial data</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-cyan-500/70 uppercase tracking-widest">Viability Score</div>
          <div className={`text-2xl font-bold tracking-widest ${getScoreColor(result.overallViability)}`}>
            {result.overallViability}%
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-6">
        
        {/* Success Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-4 relative overflow-hidden">
            <h3 className="text-xs text-cyan-500/70 uppercase tracking-widest flex items-center gap-2 mb-4">
              <BrainCircuit className="w-4 h-4" /> In-Silico Success
            </h3>
            <div className="relative h-8 bg-jarvis-bg rounded-md overflow-hidden border border-cyan-900/30">
              <motion.div 
                className={`absolute top-0 left-0 h-full ${getScoreBg(result.inSilicoSuccess)} opacity-80`}
                initial={{ width: 0 }}
                animate={{ width: `${result.inSilicoSuccess}%` }}
                transition={{ duration: 1, delay: 0.2 }}
              />
              <div className="absolute inset-0 flex items-center justify-end pr-3">
                <span className="text-lg font-bold text-white drop-shadow-md z-10">{result.inSilicoSuccess}%</span>
              </div>
            </div>
          </div>

          <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-4 relative overflow-hidden">
            <h3 className="text-xs text-cyan-500/70 uppercase tracking-widest flex items-center gap-2 mb-4">
              <Beaker className="w-4 h-4" /> In-Vitro Success
            </h3>
            <div className="relative h-8 bg-jarvis-bg rounded-md overflow-hidden border border-cyan-900/30">
              <motion.div 
                className={`absolute top-0 left-0 h-full ${getScoreBg(result.inVitroSuccess)} opacity-80`}
                initial={{ width: 0 }}
                animate={{ width: `${result.inVitroSuccess}%` }}
                transition={{ duration: 1, delay: 0.4 }}
              />
              <div className="absolute inset-0 flex items-center justify-end pr-3">
                <span className="text-lg font-bold text-white drop-shadow-md z-10">{result.inVitroSuccess}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Toxicity & Side Effects */}
        <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-4">
          <h3 className="text-xs text-cyan-500/70 uppercase tracking-widest mb-3 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" /> Toxicity Profile
          </h3>
          <p className="text-sm text-cyan-100 leading-relaxed mb-4">{result.toxicityProfile}</p>
          
          <h4 className="text-[10px] text-cyan-500/50 uppercase tracking-widest mb-2">Predicted Side Effects</h4>
          <ul className="space-y-2">
            {result.sideEffects.map((effect, idx) => (
              <li key={idx} className="text-sm px-3 py-2 bg-jarvis-bg border border-red-900/30 text-red-400 rounded flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> 
                <span>{effect}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pharmacokinetic Profile (ADME) */}
        <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-4">
          <h3 className="text-xs text-cyan-500/70 uppercase tracking-widest mb-4 flex items-center gap-2">
            <LineChart className="w-4 h-4" /> Pharmacokinetic Profile (ADME)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-jarvis-bg border border-cyan-900/30 p-3 rounded">
              <div className="text-[10px] text-cyan-500/50 uppercase tracking-widest mb-1">Absorption</div>
              <p className="text-sm text-cyan-100">{result.pharmacokineticProfile.absorption || 'N/A'}</p>
            </div>
            <div className="bg-jarvis-bg border border-cyan-900/30 p-3 rounded">
              <div className="text-[10px] text-cyan-500/50 uppercase tracking-widest mb-1">Distribution</div>
              <p className="text-sm text-cyan-100">{result.pharmacokineticProfile.distribution || 'N/A'}</p>
            </div>
            <div className="bg-jarvis-bg border border-cyan-900/30 p-3 rounded">
              <div className="text-[10px] text-cyan-500/50 uppercase tracking-widest mb-1">Metabolism</div>
              <p className="text-sm text-cyan-100">{result.pharmacokineticProfile.metabolism || 'N/A'}</p>
            </div>
            <div className="bg-jarvis-bg border border-cyan-900/30 p-3 rounded">
              <div className="text-[10px] text-cyan-500/50 uppercase tracking-widest mb-1">Excretion</div>
              <p className="text-sm text-cyan-100">{result.pharmacokineticProfile.excretion || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Clinical Projections */}
        <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-4">
          <h3 className="text-xs text-cyan-500/70 uppercase tracking-widest mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Long-Term Efficacy
          </h3>
          <p className="text-sm text-cyan-100 leading-relaxed">{result.longTermEfficacy}</p>
        </div>

        {/* Biomarkers & Clearance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-4">
            <h3 className="text-xs text-cyan-500/70 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Dna className="w-4 h-4" /> Key Biomarkers Tracked
            </h3>
            <ul className="list-disc list-inside text-sm text-cyan-100 space-y-1">
              {result.keyBiomarkers.map((biomarker, idx) => (
                <li key={idx}>{biomarker}</li>
              ))}
            </ul>
          </div>

          <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-4">
            <h3 className="text-xs text-cyan-500/70 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Filter className="w-4 h-4" /> Clearance Mechanism
            </h3>
            <p className="text-sm text-cyan-100 leading-relaxed">{result.clearanceMechanism}</p>
          </div>
        </div>

        {/* Patient Adherence */}
        <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-4 relative overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs text-cyan-500/70 uppercase tracking-widest flex items-center gap-2">
              <Users className="w-4 h-4" /> Predicted Patient Adherence
            </h3>
            <span className={`text-lg font-bold ${getScoreColor(result.patientAdherenceScore)}`}>{result.patientAdherenceScore}%</span>
          </div>
          <div className="h-1.5 bg-jarvis-bg rounded-full overflow-hidden">
            <motion.div 
              className={`h-full ${getScoreBg(result.patientAdherenceScore)}`}
              initial={{ width: 0 }}
              animate={{ width: `${result.patientAdherenceScore}%` }}
              transition={{ duration: 1, delay: 0.6 }}
            />
          </div>
        </div>

        {/* Human Trial Elimination */}
        <div className="bg-neon-cyan/5 border border-neon-cyan/30 rounded-lg p-4">
          <h3 className="text-xs text-neon-cyan uppercase tracking-widest mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Human Trial Elimination Potential
          </h3>
          <p className="text-sm text-cyan-100 leading-relaxed">{result.humanTrialEliminationPotential}</p>
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
            {loading ? 'Designing...' : 'Design Supply Chain'}
            <ChevronRight className="w-4 h-4" />
          </span>
        </button>
      </div>
    </motion.div>
  );
}
