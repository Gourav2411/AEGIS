import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Activity, Users, Clock, Dna, Syringe, RefreshCw, ChevronRight } from 'lucide-react';
import { FormulationResult, TrialParams } from '../services/geminiService';

interface TrialInputPanelProps {
  formulation: FormulationResult;
  disease: string;
  onSimulate: (params: TrialParams) => void;
  onReset: () => void;
  loading: boolean;
}

export default function TrialInputPanel({ formulation, disease, onSimulate, onReset, loading }: TrialInputPanelProps) {
  const [params, setParams] = useState<TrialParams>({
    phase: 'Phase 2',
    cohortSize: '500',
    ageGroup: 'Adults (18-65)',
    dosage: '50',
    dosageUnit: 'mg',
    duration: '6 Months',
    geneticMarkers: 'None specific'
  });

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!params.phase) {
      setError("Trial phase is required.");
      return;
    }
    if (!params.cohortSize || isNaN(Number(params.cohortSize)) || Number(params.cohortSize) <= 0) {
      setError("Cohort size must be a valid positive number.");
      return;
    }
    if (!params.ageGroup) {
      setError("Age group is required.");
      return;
    }
    if (!params.dosage || isNaN(Number(params.dosage)) || Number(params.dosage) <= 0) {
      setError("Dosage must be a valid positive number.");
      return;
    }
    if (!params.duration) {
      setError("Trial duration is required.");
      return;
    }
    setError(null);
    onSimulate(params);
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
            Clinical Trial Simulation
          </h2>
          <p className="text-sm text-cyan-500/70 mt-2">Configure virtual trial parameters for {formulation.name}.</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-cyan-500/70 uppercase tracking-widest">Target Disease</div>
          <div className="text-sm text-neon-green font-bold tracking-widest">{disease}</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-2 space-y-6">
        {error && (
          <div className="bg-red-900/20 border border-red-500/50 text-red-400 px-4 py-3 rounded text-sm">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="space-y-2">
            <label className="text-xs text-cyan-500/70 uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-4 h-4" /> Trial Phase
            </label>
            <select 
              value={params.phase}
              onChange={(e) => setParams({...params, phase: e.target.value})}
              className="w-full bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-3 text-cyan-100 focus:border-neon-cyan focus:outline-none transition-colors appearance-none"
            >
              <option value="Pre-clinical (In-Vitro/In-Silico)">Pre-clinical (In-Vitro/In-Silico)</option>
              <option value="Phase 1">Phase 1 (Safety)</option>
              <option value="Phase 2">Phase 2 (Efficacy)</option>
              <option value="Phase 3">Phase 3 (Large Scale)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-cyan-500/70 uppercase tracking-widest flex items-center gap-2">
              <Users className="w-4 h-4" /> Cohort Size
            </label>
            <select 
              value={params.cohortSize}
              onChange={(e) => setParams({...params, cohortSize: e.target.value})}
              className="w-full bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-3 text-cyan-100 focus:border-neon-cyan focus:outline-none transition-colors appearance-none"
            >
              <option value="50">50 Virtual Patients</option>
              <option value="500">500 Virtual Patients</option>
              <option value="5000">5,000 Virtual Patients</option>
              <option value="50000">50,000 Virtual Patients</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-cyan-500/70 uppercase tracking-widest flex items-center gap-2">
              <Users className="w-4 h-4" /> Age Group
            </label>
            <select 
              value={params.ageGroup}
              onChange={(e) => setParams({...params, ageGroup: e.target.value})}
              className="w-full bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-3 text-cyan-100 focus:border-neon-cyan focus:outline-none transition-colors appearance-none"
            >
              <option value="Pediatric (0-17)">Pediatric (0-17)</option>
              <option value="Adults (18-65)">Adults (18-65)</option>
              <option value="Geriatric (65+)">Geriatric (65+)</option>
              <option value="All Ages">All Ages</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-cyan-500/70 uppercase tracking-widest flex items-center gap-2">
              <Syringe className="w-4 h-4" /> Dosage Regimen
            </label>
            <div className="flex gap-2">
              <input 
                type="number"
                min="0"
                step="any"
                required
                value={params.dosage}
                onChange={(e) => setParams({...params, dosage: e.target.value})}
                placeholder="e.g., 50"
                className="w-full bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-3 text-cyan-100 focus:border-neon-cyan focus:outline-none transition-colors"
              />
              <select
                value={params.dosageUnit}
                onChange={(e) => setParams({...params, dosageUnit: e.target.value})}
                className="w-24 bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-3 text-cyan-100 focus:border-neon-cyan focus:outline-none transition-colors appearance-none"
              >
                <option value="mg">mg</option>
                <option value="mcg">mcg</option>
                <option value="g">g</option>
                <option value="ml">ml</option>
                <option value="IU">IU</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-cyan-500/70 uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-4 h-4" /> Trial Duration
            </label>
            <select 
              value={params.duration}
              onChange={(e) => setParams({...params, duration: e.target.value})}
              className="w-full bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-3 text-cyan-100 focus:border-neon-cyan focus:outline-none transition-colors appearance-none"
            >
              <option value="1 Month">1 Month</option>
              <option value="6 Months">6 Months</option>
              <option value="1 Year">1 Year</option>
              <option value="5 Years">5 Years</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-cyan-500/70 uppercase tracking-widest flex items-center gap-2">
              <Dna className="w-4 h-4" /> Genetic Markers / Subgroups
            </label>
            <input 
              type="text"
              value={params.geneticMarkers}
              onChange={(e) => setParams({...params, geneticMarkers: e.target.value})}
              placeholder="e.g., BRCA1+, EGFR mutation"
              className="w-full bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-3 text-cyan-100 focus:border-neon-cyan focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-cyan-900/50 flex justify-between items-center">
          <button 
            type="button"
            onClick={onReset}
            disabled={loading}
            className="px-4 py-2 text-xs text-cyan-500/70 hover:text-cyan-100 uppercase tracking-widest flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Abort & Restart
          </button>
          
          <button 
            type="submit"
            disabled={loading}
            className="group relative px-6 py-3 bg-cyan-950/50 border border-neon-cyan text-neon-cyan text-sm uppercase tracking-widest hover:bg-neon-cyan hover:text-jarvis-bg transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
          >
            <div className="absolute inset-0 bg-neon-cyan/20 translate-x-full group-hover:translate-x-0 transition-transform"></div>
            <span className="relative flex items-center gap-2">
              {loading ? 'Initializing...' : 'Run Simulation'}
              <ChevronRight className="w-4 h-4" />
            </span>
          </button>
        </div>
      </form>
    </motion.div>
  );
}
