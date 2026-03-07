import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Users, Clock, Dna, Syringe, RefreshCw, ChevronRight, CheckCircle2, Circle } from 'lucide-react';
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
  const [simulationPhase, setSimulationPhase] = useState(0);

  useEffect(() => {
    if (loading) {
      setSimulationPhase(0);
      const interval = setInterval(() => {
        setSimulationPhase(prev => (prev < 4 ? prev + 1 : prev));
      }, 2000);
      return () => clearInterval(interval);
    } else {
      setSimulationPhase(0);
    }
  }, [loading]);

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

      <div className="flex-1 overflow-y-auto pr-2">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="simulation-progress"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full flex flex-col justify-center max-w-md mx-auto space-y-8"
            >
              <div className="text-center mb-8">
                <h3 className="text-xl text-neon-cyan uppercase tracking-widest mb-2 font-bold">Simulation in Progress</h3>
                <p className="text-sm text-cyan-500/70">Running multi-phasic virtual trials on {params.cohortSize} synthetic patients.</p>
              </div>

              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-cyan-900/50 before:to-transparent">
                {[
                  { title: 'In-Silico Molecular Docking', desc: 'Simulating receptor binding affinity and off-target interactions.' },
                  { title: 'In-Vitro Cell Culture Models', desc: 'Evaluating cellular toxicity and metabolic stability.' },
                  { title: 'Pharmacokinetic Profiling', desc: 'Calculating ADME (Absorption, Distribution, Metabolism, Excretion).' },
                  { title: 'Virtual Human Cohort Trial', desc: `Simulating efficacy across ${params.cohortSize} diverse genetic profiles.` },
                  { title: 'Data Aggregation & Analysis', desc: 'Compiling success rates, side effects, and overall viability.' }
                ].map((phase, idx) => (
                  <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow transition-colors duration-500 ${
                      simulationPhase > idx ? 'bg-neon-cyan border-neon-cyan text-jarvis-bg' :
                      simulationPhase === idx ? 'bg-jarvis-bg border-neon-cyan text-neon-cyan animate-pulse' :
                      'bg-jarvis-bg border-cyan-900/50 text-cyan-900/50'
                    }`}>
                      {simulationPhase > idx ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-3 h-3 fill-current" />}
                    </div>
                    <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-lg border transition-all duration-500 ${
                      simulationPhase >= idx ? 'bg-cyan-950/20 border-cyan-500/30' : 'bg-transparent border-transparent opacity-30'
                    }`}>
                      <h4 className={`text-sm font-bold uppercase tracking-widest mb-1 ${simulationPhase >= idx ? 'text-cyan-100' : 'text-cyan-500/50'}`}>{phase.title}</h4>
                      <p className="text-xs text-cyan-500/70 leading-relaxed">{phase.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.form 
              key="input-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit} 
              className="space-y-6"
            >
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
                  <span className="relative flex items-center gap-2 font-bold">
                    {loading ? 'Initializing...' : 'Run Simulation'}
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
