import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Users, Clock, Dna, Syringe, RefreshCw, ChevronRight, CheckCircle2, Circle, Database, Search, Beaker, Zap, AlertTriangle, Upload } from 'lucide-react';
import { FormulationResult, TrialParams, optimizeProtocol, ProtocolOptimizationResult, connectToLiveEHR } from '../services/geminiService';

interface TrialInputPanelProps {
  formulation: FormulationResult;
  disease: string;
  onSimulate: (params: TrialParams) => void;
  onReset: () => void;
  loading: boolean;
  csvData: string | null;
  setCsvData: (data: string | null) => void;
}

export default function TrialInputPanel({ formulation, disease, onSimulate, onReset, loading, csvData, setCsvData }: TrialInputPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const defaultParams: TrialParams = {
    phase: 'Phase 2',
    cohortSize: '500',
    ageGroup: 'Adults (18-65)',
    dosage: '50',
    dosageUnit: 'mg',
    duration: '6 Months',
    geneticMarkers: 'None specific',
    diseaseSeverity: '',
    previousTreatments: '',
    inclusionCriteria: '',
    exclusionCriteria: '',
    dosageAdjustments: '',
    useSCA: false,
    useAdaptiveDesign: false,
    useRAG: false
  };

  const [params, setParams] = useState<TrialParams>(defaultParams);

  const [error, setError] = useState<string | null>(null);
  const [simulationPhase, setSimulationPhase] = useState(0);
  const [qsarData, setQsarData] = useState<any>(null);
  const [qsarLoading, setQsarLoading] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<ProtocolOptimizationResult | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [liveEHRConnecting, setLiveEHRConnecting] = useState(false);
  const [liveEHRConnected, setLiveEHRConnected] = useState(false);
  const [liveEHRRecords, setLiveEHRRecords] = useState(0);

  useEffect(() => {
    const fetchQsar = async () => {
      setQsarLoading(true);
      try {
        const smilesToUse = formulation.smilesString || formulation.molecularStructure;
        const res = await fetch('/api/qsar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ smiles: smilesToUse })
        });
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.indexOf("application/json") !== -1) {
            const data = await res.json();
            setQsarData(data);
          } else {
            console.error("QSAR response was not JSON");
          }
        }
      } catch (err) {
        console.error("Failed to fetch QSAR data", err);
      } finally {
        setQsarLoading(false);
      }
    };
    if (formulation.smilesString || formulation.molecularStructure) {
      fetchQsar();
    }
  }, [formulation.smilesString, formulation.molecularStructure]);

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

  const handleOptimize = async () => {
    setOptimizing(true);
    try {
      const result = await optimizeProtocol(disease, params);
      setOptimizationResult(result);
    } catch (err) {
      console.error("Optimization failed", err);
    } finally {
      setOptimizing(false);
    }
  };

  const handleResetParams = () => {
    setParams(defaultParams);
    setOptimizationResult(null);
    setLiveEHRConnected(false);
    setLiveEHRRecords(0);
  };

  const handleConnectLiveEHR = async () => {
    setLiveEHRConnecting(true);
    let records = 0;
    const interval = setInterval(() => {
      records += Math.floor(Math.random() * 5000) + 1000;
      setLiveEHRRecords(records);
    }, 200);

    try {
      const finalRecords = await connectToLiveEHR(disease, params);
      clearInterval(interval);
      setLiveEHRConnecting(false);
      setLiveEHRConnected(true);
      setLiveEHRRecords(finalRecords);
    } catch (error) {
      clearInterval(interval);
      setLiveEHRConnecting(false);
      console.error("Failed to connect to live EHR", error);
    }
  };

  useEffect(() => {
    const isAgentic = !!formulation.optimizationLog;
    const isEHR = liveEHRConnected;

    if (isAgentic || isEHR) {
      let newPhase = 'Phase 2';
      let newCohortSize = '500';
      let newDuration = '6 Months';

      if (isAgentic && isEHR) {
        newPhase = 'Phase 3';
        newCohortSize = '50000';
        newDuration = '1 Month';
      } else if (isAgentic) {
        newPhase = 'Phase 3';
        newCohortSize = '5000';
        newDuration = '3 Months';
      } else if (isEHR) {
        newPhase = 'Phase 2';
        newCohortSize = '50000';
        newDuration = '1 Month';
      }

      setParams(prev => ({
        ...prev,
        phase: newPhase,
        cohortSize: newCohortSize,
        duration: newDuration,
        useAdaptiveDesign: true
      }));
    }
  }, [formulation.optimizationLog, liveEHRConnected]);

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
    onSimulate({
      ...params,
      liveEHRRecords: liveEHRConnected ? liveEHRRecords : undefined
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result;
        if (typeof text === 'string') {
          setCsvData(text);
          setError(null);
        }
      };
      reader.onerror = () => {
        setError("Failed to read the file.");
      };
      reader.readAsText(file);
    }
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
                <p className="text-sm text-cyan-500/70">
                  {params.useSCA 
                    ? `Generating synthetic placebo group from EHR data and running trials on ${Number(params.cohortSize) / 2} recruited patients.`
                    : `Running multi-phasic virtual trials on ${params.cohortSize} synthetic patients.`}
                </p>
              </div>

              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-cyan-900/50 before:to-transparent">
                {[
                  ...(params.useSCA ? [{ title: 'EHR Data Mining', desc: 'Extracting historical patient data for Synthetic Control Arm.' }] : []),
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
                    <option value="3 Months">3 Months</option>
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

                <div className="space-y-2">
                  <label className="text-xs text-cyan-500/70 uppercase tracking-widest flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Disease Severity
                  </label>
                  <input 
                    type="text"
                    value={params.diseaseSeverity}
                    onChange={(e) => setParams({...params, diseaseSeverity: e.target.value})}
                    placeholder="e.g., Mild to Moderate, Stage III"
                    className="w-full bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-3 text-cyan-100 focus:border-neon-cyan focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-cyan-500/70 uppercase tracking-widest flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Previous Treatments
                  </label>
                  <input 
                    type="text"
                    value={params.previousTreatments}
                    onChange={(e) => setParams({...params, previousTreatments: e.target.value})}
                    placeholder="e.g., Treatment-naive, Post-chemotherapy"
                    className="w-full bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-3 text-cyan-100 focus:border-neon-cyan focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-cyan-500/70 uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Inclusion Criteria
                  </label>
                  <input 
                    type="text"
                    value={params.inclusionCriteria}
                    onChange={(e) => setParams({...params, inclusionCriteria: e.target.value})}
                    placeholder="e.g., BMI 18-30, Normal liver function"
                    className="w-full bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-3 text-cyan-100 focus:border-neon-cyan focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-cyan-500/70 uppercase tracking-widest flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Exclusion Criteria
                  </label>
                  <input 
                    type="text"
                    value={params.exclusionCriteria}
                    onChange={(e) => setParams({...params, exclusionCriteria: e.target.value})}
                    placeholder="e.g., History of cardiovascular disease"
                    className="w-full bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-3 text-cyan-100 focus:border-neon-cyan focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-cyan-500/70 uppercase tracking-widest flex items-center gap-2">
                    <Syringe className="w-4 h-4" /> Dosage Adjustments
                  </label>
                  <input 
                    type="text"
                    value={params.dosageAdjustments}
                    onChange={(e) => setParams({...params, dosageAdjustments: e.target.value})}
                    placeholder="e.g., Reduce by 50% for elderly"
                    className="w-full bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-3 text-cyan-100 focus:border-neon-cyan focus:outline-none transition-colors"
                  />
                </div>

                {/* Protocol Optimizer */}
                <div className="md:col-span-2 bg-cyan-950/30 border border-cyan-900/50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-sm text-neon-cyan uppercase tracking-widest font-bold flex items-center gap-2">
                        <Users className="w-4 h-4" /> Protocol Optimizer
                      </h3>
                      <p className="text-xs text-cyan-500/70 mt-1">
                        Analyze global patient databases to estimate eligible population and optimize criteria.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleOptimize}
                      disabled={optimizing}
                      className="px-4 py-2 bg-cyan-900/50 hover:bg-neon-cyan hover:text-jarvis-bg text-neon-cyan text-xs uppercase tracking-widest rounded transition-colors disabled:opacity-50"
                    >
                      {optimizing ? 'Optimizing...' : 'Optimize Protocol'}
                    </button>
                  </div>
                  
                  {optimizationResult && (
                    <div className="space-y-4 mt-4 pt-4 border-t border-cyan-900/50">
                      <div className="flex gap-4">
                        <div className="bg-jarvis-bg p-3 rounded border border-cyan-900/30 flex-1">
                          <div className="text-xs text-cyan-500/70 uppercase mb-1">Eligible Population</div>
                          <div className="text-lg text-neon-green font-bold">{optimizationResult.estimatedEligiblePopulation.toLocaleString()}</div>
                        </div>
                        <div className="bg-jarvis-bg p-3 rounded border border-cyan-900/30 flex-1">
                          <div className="text-xs text-cyan-500/70 uppercase mb-1">Feasibility</div>
                          <div className={`text-lg font-bold ${optimizationResult.recruitmentFeasibility.includes('High') ? 'text-red-400' : 'text-neon-cyan'}`}>
                            {optimizationResult.recruitmentFeasibility}
                          </div>
                        </div>
                      </div>
                      
                      {optimizationResult.suggestions.length > 0 && (
                        <div className="bg-jarvis-bg p-3 rounded border border-cyan-900/30">
                          <div className="text-xs text-cyan-500/70 uppercase mb-2">Optimization Suggestions</div>
                          <ul className="space-y-3">
                            {optimizationResult.suggestions.map((s, i) => (
                              <li key={i} className="text-xs">
                                <span className="text-neon-cyan font-bold">{s.parameter}:</span> Change from <span className="text-red-400">"{s.currentValue}"</span> to <span className="text-neon-green">"{s.suggestedValue}"</span>.
                                <div className="text-cyan-500/70 mt-1">{s.reason} <span className="text-neon-green ml-2">{s.impactOnEnrollment}</span></div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* QSAR Data */}
                <div className="md:col-span-2 bg-cyan-950/30 border border-cyan-900/50 rounded-lg p-4">
                  <h3 className="text-sm text-neon-cyan uppercase tracking-widest font-bold flex items-center gap-2 mb-4">
                    <Beaker className="w-4 h-4" /> QSAR Predictions
                  </h3>
                  {qsarLoading ? (
                    <div className="text-xs text-cyan-500/70 animate-pulse">Running QSAR models on SMILES string...</div>
                  ) : qsarData ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-xs text-cyan-500/70 uppercase">Predicted Toxicity (LD50)</div>
                        <div className="text-sm text-cyan-100">{Number(qsarData.toxicityLD50).toFixed(0)} mg/kg</div>
                      </div>
                      <div>
                        <div className="text-xs text-cyan-500/70 uppercase">Predicted Solubility</div>
                        <div className="text-sm text-cyan-100">{Number(qsarData.solubility).toFixed(2)} mg/mL</div>
                      </div>
                      <div>
                        <div className="text-xs text-cyan-500/70 uppercase">Predicted Clearance Rates</div>
                        <div className="text-sm text-cyan-100">{Number(qsarData.clearanceRate).toFixed(2)} mL/min/kg</div>
                      </div>
                      <div>
                        <div className="text-xs text-cyan-500/70 uppercase">LogP</div>
                        <div className="text-sm text-cyan-100">{Number(qsarData.logP).toFixed(2)}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-cyan-500/70">QSAR data unavailable.</div>
                  )}
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="flex items-start gap-4 p-4 bg-cyan-950/20 border border-cyan-900/50 rounded-lg cursor-pointer hover:bg-cyan-950/40 transition-colors">
                    <div className="relative mt-1">
                      <input 
                        type="checkbox" 
                        className="sr-only"
                        checked={params.useSCA || false}
                        onChange={(e) => setParams({...params, useSCA: e.target.checked})}
                      />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${params.useSCA ? 'bg-neon-cyan' : 'bg-cyan-900/50'}`}></div>
                      <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${params.useSCA ? 'translate-x-4' : ''}`}></div>
                    </div>
                    <div>
                      <div className="text-sm text-neon-cyan uppercase tracking-widest font-bold flex items-center gap-2">
                        <Database className="w-4 h-4" /> Enable Synthetic Control Arm (SCA)
                      </div>
                      <p className="text-xs text-cyan-500/70 mt-1">
                        Generate a mathematically rigorous "virtual placebo group" using anonymized Electronic Health Record (EHR) data. This eliminates the need to recruit half of your trial participants, saving months or years.
                      </p>
                    </div>
                  </label>
                  
                  <AnimatePresence>
                    {params.useSCA && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 p-4 bg-cyan-950/30 border border-cyan-900/50 rounded-lg flex flex-col gap-3">
                          <div className="flex justify-between items-center">
                            <div className="text-sm text-neon-cyan uppercase tracking-widest font-bold flex items-center gap-2">
                              <Zap className="w-4 h-4" /> Live EHR & Genomic Networks
                            </div>
                            {!liveEHRConnected && !liveEHRConnecting && (
                              <button
                                type="button"
                                onClick={handleConnectLiveEHR}
                                className="px-3 py-1.5 bg-cyan-900/50 hover:bg-neon-cyan hover:text-jarvis-bg text-neon-cyan text-xs uppercase tracking-widest rounded transition-colors"
                              >
                                Connect to TriNetX / Datavant
                              </button>
                            )}
                          </div>
                          
                          <p className="text-xs text-cyan-500/70">
                            Connect to live, anonymized multi-omics and EHR networks to pull real-time patient data for the control arm.
                          </p>

                          {(liveEHRConnecting || liveEHRConnected) && (
                            <div className="bg-jarvis-bg p-3 rounded border border-cyan-900/30 font-mono text-xs">
                              {liveEHRConnecting && (
                                <div className="text-cyan-500/70 animate-pulse mb-1">
                                  Establishing secure connection to federated EHR networks...
                                </div>
                              )}
                              <div className="flex justify-between items-center">
                                <span className={liveEHRConnected ? 'text-neon-green' : 'text-cyan-100'}>
                                  {liveEHRConnected ? 'Connection Established. Live Data Stream Active.' : 'Mining anonymized patient records...'}
                                </span>
                                <span className="text-neon-cyan font-bold">
                                  {liveEHRRecords.toLocaleString()} records matched
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="flex items-start gap-4 p-4 bg-cyan-950/20 border border-cyan-900/50 rounded-lg cursor-pointer hover:bg-cyan-950/40 transition-colors">
                    <div className="relative mt-1">
                      <input 
                        type="checkbox" 
                        className="sr-only"
                        checked={params.useAdaptiveDesign || false}
                        onChange={(e) => setParams({...params, useAdaptiveDesign: e.target.checked})}
                      />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${params.useAdaptiveDesign ? 'bg-neon-cyan' : 'bg-cyan-900/50'}`}></div>
                      <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${params.useAdaptiveDesign ? 'translate-x-4' : ''}`}></div>
                    </div>
                    <div>
                      <div className="text-sm text-neon-cyan uppercase tracking-widest font-bold flex items-center gap-2">
                        <Activity className="w-4 h-4" /> Enable Bayesian Adaptive Design
                      </div>
                      <p className="text-xs text-cyan-500/70 mt-1">
                        Automatically adjust patient allocation, drop failing dosages, or narrow the target demographic while the trial is running based on early data. Prevents trials from failing completely in Phase III by pivoting early.
                      </p>
                    </div>
                  </label>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="flex items-start gap-4 p-4 bg-cyan-950/20 border border-cyan-900/50 rounded-lg cursor-pointer hover:bg-cyan-950/40 transition-colors">
                    <div className="relative mt-1">
                      <input 
                        type="checkbox" 
                        className="sr-only"
                        checked={params.useRAG || false}
                        onChange={(e) => setParams({...params, useRAG: e.target.checked})}
                      />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${params.useRAG ? 'bg-neon-cyan' : 'bg-cyan-900/50'}`}></div>
                      <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${params.useRAG ? 'translate-x-4' : ''}`}></div>
                    </div>
                    <div>
                      <div className="text-sm text-neon-cyan uppercase tracking-widest font-bold flex items-center gap-2">
                        <Search className="w-4 h-4" /> Enable Real-World Grounding (RAG)
                      </div>
                      <p className="text-xs text-cyan-500/70 mt-1">
                        Query PubChem, ChEMBL, and ClinicalTrials.gov for similar molecular structures and historical trial failures. Bases the simulation strictly on empirical data from structurally similar compounds.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-cyan-900/50 flex justify-between items-center">
                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={onReset}
                    disabled={loading}
                    className="px-4 py-2 text-xs text-cyan-500/70 hover:text-cyan-100 uppercase tracking-widest flex items-center gap-2 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" /> Abort & Restart
                  </button>
                  <button 
                    type="button"
                    onClick={handleResetParams}
                    disabled={loading}
                    className="px-4 py-2 text-xs text-cyan-500/70 hover:text-cyan-100 uppercase tracking-widest flex items-center gap-2 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" /> Reset Parameters
                  </button>
                  <div className="relative flex items-center">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      ref={fileInputRef}
                      className="hidden"
                      id="csv-upload"
                    />
                    <label
                      htmlFor="csv-upload"
                      className={`px-4 py-2 text-xs uppercase tracking-widest flex items-center gap-2 transition-colors cursor-pointer ${
                        csvData ? 'text-neon-green hover:text-green-400' : 'text-cyan-500/70 hover:text-cyan-100'
                      }`}
                    >
                      <Upload className="w-3 h-3" />
                      {csvData ? 'CSV Loaded' : 'Upload CSV'}
                    </label>
                    {csvData && (
                      <button
                        type="button"
                        onClick={() => {
                          setCsvData(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                        className="ml-2 text-xs text-red-400 hover:text-red-300 uppercase tracking-widest"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
                
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
