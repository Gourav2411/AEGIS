import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Search, Activity, ShieldAlert, ChevronDown, ChevronUp, Beaker, GitCompare, Filter as FilterIcon, ArrowUpDown, X, Network, LayoutGrid, Scale } from 'lucide-react';
import { simulateDrugInteractions, InteractionResult, FormulationResult } from '../services/geminiService';
import NetworkGraph from './NetworkGraph';

interface InteractionSimulatorProps {
  formulation: FormulationResult;
}

interface SimulationEntry {
  id: string;
  drugName: string;
  result: InteractionResult | null;
  loading: boolean;
  error: string | null;
}

export default function InteractionSimulator({ formulation }: InteractionSimulatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'network' | 'compare'>('cards');
  
  const [simulations, setSimulations] = useState<SimulationEntry[]>([]);
  const [newDrug, setNewDrug] = useState('');
  
  const [filterSeverity, setFilterSeverity] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('None');

  const [compareDrug1, setCompareDrug1] = useState<string>('');
  const [compareDrug2, setCompareDrug2] = useState<string>('');

  const COMMON_DRUGS = ['Warfarin', 'Omeprazole', 'Atorvastatin', 'Ibuprofen', 'Metformin'];

  const handleSimulate = async (e?: React.FormEvent, drugToTest?: string) => {
    if (e) e.preventDefault();
    
    const targetDrug = drugToTest || newDrug;
    if (!targetDrug.trim()) return;

    // Check if already in list
    if (simulations.some(s => s.drugName.toLowerCase() === targetDrug.toLowerCase())) {
      setNewDrug('');
      return;
    }

    const newId = Date.now().toString();
    const newEntry: SimulationEntry = {
      id: newId,
      drugName: targetDrug,
      result: null,
      loading: true,
      error: null
    };

    setSimulations(prev => [newEntry, ...prev]);
    setNewDrug('');

    try {
      const res = await simulateDrugInteractions(formulation.name, formulation.mechanismOfAction, targetDrug);
      setSimulations(prev => prev.map(s => s.id === newId ? { ...s, result: res, loading: false } : s));
    } catch (err: any) {
      setSimulations(prev => prev.map(s => s.id === newId ? { ...s, error: err.message || "Failed to simulate interaction.", loading: false } : s));
    }
  };

  const removeSimulation = (id: string) => {
    setSimulations(prev => prev.filter(s => s.id !== id));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'low': return 'text-green-400 border-green-900/50 bg-green-950/20';
      case 'moderate': return 'text-yellow-400 border-yellow-900/50 bg-yellow-950/20';
      case 'high': return 'text-orange-400 border-orange-900/50 bg-orange-950/20';
      case 'severe': return 'text-red-500 border-red-900/50 bg-red-950/20';
      default: return 'text-cyan-400 border-cyan-900/50 bg-cyan-950/20';
    }
  };

  const severityRank: Record<string, number> = {
    'severe': 4,
    'high': 3,
    'moderate': 2,
    'low': 1
  };

  const filteredAndSortedSimulations = useMemo(() => {
    let result = [...simulations];

    if (filterSeverity !== 'All') {
      result = result.filter(s => s.result?.severity.toLowerCase() === filterSeverity.toLowerCase() || s.loading || s.error);
    }

    if (sortBy === 'Severity (High to Low)') {
      result.sort((a, b) => {
        const rankA = a.result ? severityRank[a.result.severity.toLowerCase()] || 0 : 0;
        const rankB = b.result ? severityRank[b.result.severity.toLowerCase()] || 0 : 0;
        return rankB - rankA;
      });
    } else if (sortBy === 'Severity (Low to High)') {
      result.sort((a, b) => {
        const rankA = a.result ? severityRank[a.result.severity.toLowerCase()] || 0 : 0;
        const rankB = b.result ? severityRank[b.result.severity.toLowerCase()] || 0 : 0;
        return rankA - rankB;
      });
    }

    return result;
  }, [simulations, filterSeverity, sortBy]);

  const renderResult = (sim: SimulationEntry) => {
    if (sim.loading) {
      return (
        <div key={sim.id} className="flex items-center justify-center p-8 border border-cyan-900/50 rounded-lg bg-cyan-950/10 h-full relative min-h-[200px]">
          <button onClick={() => removeSimulation(sim.id)} className="absolute top-2 right-2 text-cyan-500/50 hover:text-cyan-400"><X className="w-4 h-4" /></button>
          <span className="animate-pulse text-cyan-500 flex items-center gap-2">
            <Activity className="w-4 h-4" /> Simulating {sim.drugName}...
          </span>
        </div>
      );
    }

    if (sim.error) {
      return (
        <div key={sim.id} className="p-4 bg-red-950/30 border border-red-900/50 text-red-400 text-sm rounded-lg flex items-start gap-2 relative min-h-[200px]">
          <button onClick={() => removeSimulation(sim.id)} className="absolute top-2 right-2 text-red-500/50 hover:text-red-400"><X className="w-4 h-4" /></button>
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <div className="font-bold mb-1">{sim.drugName}</div>
            {sim.error}
          </div>
        </div>
      );
    }

    if (!sim.result) return null;

    return (
      <motion.div
        key={sim.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-4 rounded-lg border h-full flex flex-col relative ${getSeverityColor(sim.result.severity)}`}
      >
        <button onClick={() => removeSimulation(sim.id)} className="absolute top-2 right-2 opacity-50 hover:opacity-100 transition-opacity"><X className="w-4 h-4" /></button>
        <div className="flex justify-between items-start mb-4 pb-4 border-b border-current/20 pr-6">
          <div>
            <div className="text-[10px] uppercase tracking-widest opacity-70 mb-1">Interaction with {sim.drugName}</div>
            <div className="text-xl font-bold uppercase tracking-wider flex items-center gap-2">
              {sim.result.severity === 'Severe' || sim.result.severity === 'High' ? <ShieldAlert className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
              {sim.result.severity}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest opacity-70 mb-1">Risk Score</div>
            <div className="text-2xl font-bold font-mono">{sim.result.riskScore}/100</div>
          </div>
        </div>

        <div className="space-y-4 flex-1">
          <div>
            <h4 className="text-xs uppercase tracking-widest opacity-70 mb-1">Mechanism</h4>
            <p className="text-sm leading-relaxed opacity-90">{sim.result.interactionMechanism}</p>
          </div>
          
          <div>
            <h4 className="text-xs uppercase tracking-widest opacity-70 mb-1">Consequences</h4>
            <p className="text-sm leading-relaxed opacity-90">{sim.result.clinicalConsequences}</p>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-widest opacity-70 mb-2">Affected Pathways</h4>
            <div className="flex flex-wrap gap-2">
              {sim.result.affectedPathways.map((pathway, idx) => (
                <span key={idx} className="text-[10px] px-2 py-1 bg-black/20 rounded border border-current/20">
                  {pathway}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-current/20 mt-4">
          <h4 className="text-xs uppercase tracking-widest opacity-70 mb-1">Recommendation</h4>
          <p className="text-sm font-bold opacity-90">{sim.result.recommendation}</p>
        </div>
      </motion.div>
    );
  };

  const renderCompareMode = () => {
    const completedSimulations = simulations.filter(s => s.result !== null);
    
    if (completedSimulations.length < 2) {
      return (
        <div className="flex items-center justify-center p-8 border border-cyan-900/30 border-dashed rounded-lg bg-cyan-950/5 text-cyan-500/30 text-xs uppercase tracking-widest">
          Simulate at least two drugs to compare them side-by-side.
        </div>
      );
    }

    const sim1 = completedSimulations.find(s => s.id === compareDrug1) || completedSimulations[0];
    const sim2 = completedSimulations.find(s => s.id === compareDrug2) || completedSimulations[1];

    return (
      <div className="space-y-6">
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <select
              value={sim1.id}
              onChange={(e) => setCompareDrug1(e.target.value)}
              className="w-full appearance-none bg-jarvis-bg border border-cyan-900/50 rounded pl-4 pr-8 py-2 text-sm text-cyan-100 focus:outline-none focus:border-neon-cyan transition-colors"
            >
              {completedSimulations.map(s => (
                <option key={s.id} value={s.id}>{s.drugName}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500/50 pointer-events-none" />
          </div>
          <div className="text-cyan-500/50 uppercase tracking-widest text-xs font-bold">VS</div>
          <div className="flex-1 relative">
            <select
              value={sim2.id}
              onChange={(e) => setCompareDrug2(e.target.value)}
              className="w-full appearance-none bg-jarvis-bg border border-cyan-900/50 rounded pl-4 pr-8 py-2 text-sm text-cyan-100 focus:outline-none focus:border-neon-cyan transition-colors"
            >
              {completedSimulations.map(s => (
                <option key={s.id} value={s.id}>{s.drugName}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500/50 pointer-events-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[sim1, sim2].map((sim, index) => (
            <div key={`${sim.id}-${index}`} className={`p-4 rounded-lg border flex flex-col ${getSeverityColor(sim.result!.severity)}`}>
              <div className="flex justify-between items-start mb-4 pb-4 border-b border-current/20">
                <div>
                  <div className="text-[10px] uppercase tracking-widest opacity-70 mb-1">{sim.drugName}</div>
                  <div className="text-xl font-bold uppercase tracking-wider flex items-center gap-2">
                    {sim.result!.severity === 'Severe' || sim.result!.severity === 'High' ? <ShieldAlert className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                    {sim.result!.severity}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-widest opacity-70 mb-1">Risk Score</div>
                  <div className="text-2xl font-bold font-mono">{sim.result!.riskScore}/100</div>
                </div>
              </div>

              <div className="space-y-4 flex-1">
                <div>
                  <h4 className="text-xs uppercase tracking-widest opacity-70 mb-1">Mechanism</h4>
                  <p className="text-sm leading-relaxed opacity-90">{sim.result!.interactionMechanism}</p>
                </div>
                
                <div>
                  <h4 className="text-xs uppercase tracking-widest opacity-70 mb-1">Consequences</h4>
                  <p className="text-sm leading-relaxed opacity-90">{sim.result!.clinicalConsequences}</p>
                </div>

                <div>
                  <h4 className="text-xs uppercase tracking-widest opacity-70 mb-2">Affected Pathways</h4>
                  <div className="flex flex-wrap gap-2">
                    {sim.result!.affectedPathways.map((pathway, idx) => (
                      <span key={idx} className="text-[10px] px-2 py-1 bg-black/20 rounded border border-current/20">
                        {pathway}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-current/20 mt-4">
                <h4 className="text-xs uppercase tracking-widest opacity-70 mb-1">Recommendation</h4>
                <p className="text-sm font-bold opacity-90">{sim.result!.recommendation}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg overflow-hidden mt-6">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-cyan-900/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-neon-cyan" />
          <h3 className="text-sm text-neon-cyan uppercase tracking-widest font-bold">
            Drug Interaction Simulator
          </h3>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-cyan-500" /> : <ChevronDown className="w-4 h-4 text-cyan-500" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 border-t border-cyan-900/50">
              <div className="flex justify-between items-start mb-4">
                <p className="text-xs text-cyan-500/70 leading-relaxed max-w-2xl">
                  Run targeted simulations to assess the pharmacokinetic and pharmacodynamic interactions between <strong className="text-cyan-300">{formulation.name}</strong> and other specific compounds.
                </p>
                <div className="flex bg-cyan-950/50 rounded border border-cyan-900/50 p-1">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`px-3 py-1 text-xs rounded transition-colors flex items-center gap-1 ${viewMode === 'cards' ? 'bg-cyan-900/50 text-cyan-300' : 'text-cyan-500/70 hover:text-cyan-400'}`}
                  >
                    <LayoutGrid className="w-3 h-3" /> Cards
                  </button>
                  <button
                    onClick={() => setViewMode('network')}
                    className={`px-3 py-1 text-xs rounded transition-colors flex items-center gap-1 ${viewMode === 'network' ? 'bg-cyan-900/50 text-cyan-300' : 'text-cyan-500/70 hover:text-cyan-400'}`}
                  >
                    <Network className="w-3 h-3" /> Network
                  </button>
                  <button
                    onClick={() => setViewMode('compare')}
                    className={`px-3 py-1 text-xs rounded transition-colors flex items-center gap-1 ${viewMode === 'compare' ? 'bg-cyan-900/50 text-cyan-300' : 'text-cyan-500/70 hover:text-cyan-400'}`}
                  >
                    <Scale className="w-3 h-3" /> Compare
                  </button>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <form onSubmit={(e) => handleSimulate(e)} className="flex gap-2 flex-1">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500/50" />
                    <input
                      type="text"
                      value={newDrug}
                      onChange={(e) => setNewDrug(e.target.value)}
                      placeholder="Enter drug name to test (e.g., Warfarin)"
                      className="w-full bg-jarvis-bg border border-cyan-900/50 rounded pl-9 pr-3 py-2 text-sm text-cyan-100 placeholder-cyan-500/30 focus:outline-none focus:border-neon-cyan transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!newDrug.trim()}
                    className="px-4 py-2 bg-cyan-900/30 border border-cyan-700 text-neon-cyan rounded text-sm hover:bg-neon-cyan hover:text-jarvis-bg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Beaker className="w-4 h-4" /> Simulate
                  </button>
                </form>

                {viewMode === 'cards' && (
                  <div className="flex gap-2">
                    <div className="relative">
                      <FilterIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500/50" />
                      <select
                        value={filterSeverity}
                        onChange={(e) => setFilterSeverity(e.target.value)}
                        className="appearance-none bg-jarvis-bg border border-cyan-900/50 rounded pl-9 pr-8 py-2 text-sm text-cyan-100 focus:outline-none focus:border-neon-cyan transition-colors"
                      >
                        <option value="All">All Severities</option>
                        <option value="Low">Low</option>
                        <option value="Moderate">Moderate</option>
                        <option value="High">High</option>
                        <option value="Severe">Severe</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500/50 pointer-events-none" />
                    </div>

                    <div className="relative">
                      <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500/50" />
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="appearance-none bg-jarvis-bg border border-cyan-900/50 rounded pl-9 pr-8 py-2 text-sm text-cyan-100 focus:outline-none focus:border-neon-cyan transition-colors"
                      >
                        <option value="None">Sort By...</option>
                        <option value="Severity (High to Low)">Severity (High to Low)</option>
                        <option value="Severity (Low to High)">Severity (Low to High)</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500/50 pointer-events-none" />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-6">
                <span className="text-xs text-cyan-500/50 uppercase tracking-widest">Quick Fill:</span>
                {COMMON_DRUGS.map(drug => (
                  <button
                    key={drug}
                    type="button"
                    onClick={() => handleSimulate(undefined, drug)}
                    className="text-[10px] px-2 py-1 bg-cyan-950/30 border border-cyan-900/50 text-cyan-400 rounded hover:bg-cyan-900/50 hover:text-cyan-200 transition-colors"
                  >
                    {drug}
                  </button>
                ))}
              </div>

              {viewMode === 'network' ? (
                <NetworkGraph primaryDrugName={formulation.name} simulations={simulations} />
              ) : viewMode === 'compare' ? (
                renderCompareMode()
              ) : (
                <>
                  {simulations.length === 0 ? (
                    <div className="flex items-center justify-center p-8 border border-cyan-900/30 border-dashed rounded-lg bg-cyan-950/5 text-cyan-500/30 text-xs uppercase tracking-widest">
                      No interactions simulated yet. Add a drug to begin.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <AnimatePresence>
                        {filteredAndSortedSimulations.map(sim => renderResult(sim))}
                      </AnimatePresence>
                    </div>
                  )}

                  {simulations.length > 0 && filteredAndSortedSimulations.length === 0 && (
                    <div className="flex items-center justify-center p-8 border border-cyan-900/30 border-dashed rounded-lg bg-cyan-950/5 text-cyan-500/30 text-xs uppercase tracking-widest">
                      No results match the current filter.
                    </div>
                  )}
                </>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

