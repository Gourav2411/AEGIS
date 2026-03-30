import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Activity, Beaker, Dna, Database, ChevronRight, RefreshCw, Layers, Zap, AlertTriangle } from 'lucide-react';
import { FormulationResult } from '../services/geminiService';
import MolecularViewer from './MolecularViewer';

interface PhysicsSimulationPanelProps {
  formulation: FormulationResult;
  receptor: string;
  onNext: () => void;
  onReset: () => void;
  onOptimize: () => void;
  loading: boolean;
  onQsarData?: (data: any) => void;
  onDockingData?: (data: any) => void;
}

export default function PhysicsSimulationPanel({ formulation, receptor, onNext, onReset, onOptimize, loading, onQsarData, onDockingData }: PhysicsSimulationPanelProps) {
  const initialSmiles = formulation.smilesString || formulation.molecularStructure || 'CC(=O)OC1=CC=CC=C1C(=O)O';
  const [customSmiles, setCustomSmiles] = useState(initialSmiles);
  const [inputSmiles, setInputSmiles] = useState(initialSmiles);
  const [qsarData, setQsarData] = useState<any>(null);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [dockingData, setDockingData] = useState<any>(null);
  const [comparisonDockingData, setComparisonDockingData] = useState<any>(null);
  const [loadingQsar, setLoadingQsar] = useState(true);
  const [loadingDocking, setLoadingDocking] = useState(true);
  const [dockingError, setDockingError] = useState<string | null>(null);

  useEffect(() => {
    // Call QSAR Backend
    setLoadingQsar(true);
    fetch('/api/qsar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ smiles: customSmiles })
    })
      .then(async res => {
        const contentType = res.headers.get("content-type");
        if (!contentType || contentType.indexOf("application/json") === -1) {
          throw new Error("QSAR response was not JSON");
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'QSAR server error');
        return data;
      })
      .then(data => {
        setQsarData(data);
        if (onQsarData) onQsarData(data);
        setLoadingQsar(false);
      })
      .catch(err => {
        console.error(err);
        setQsarData({ error: err.message });
        if (onQsarData) onQsarData({ error: err.message });
        setLoadingQsar(false);
      });

    // Call Docking Backend
    setLoadingDocking(true);
    setDockingError(null);
    fetch('/api/docking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ smiles: customSmiles, receptor })
    })
      .then(async res => {
        const contentType = res.headers.get("content-type");
        if (!contentType || contentType.indexOf("application/json") === -1) {
          throw new Error("Docking response was not JSON");
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Docking server error');
        return data;
      })
      .then(data => {
        setDockingData(data);
        if (onDockingData) onDockingData(data);
        setLoadingDocking(false);
      })
      .catch(err => {
        console.error(err);
        setDockingError(err.message || 'Failed to connect to the docking server.');
        if (onDockingData) onDockingData({ error: err.message || 'Failed to connect to the docking server.' });
        setLoadingDocking(false);
      });
  }, [customSmiles, receptor]);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="h-full flex flex-col font-mono"
    >
      <div className="mb-6 border-b border-cyan-900/50 pb-4 flex justify-between items-end">
        <div>
          <h2 className="text-xl text-neon-cyan uppercase tracking-widest flex items-center gap-2">
            <Database className="w-5 h-5" />
            Physics-Based Modeling
          </h2>
          <p className="text-xs text-cyan-500/70 mt-1 uppercase tracking-widest">Deterministic QSAR & Molecular Docking</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-6">
        {/* Custom SMILES Input */}
        <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-4">
          <h3 className="text-xs text-cyan-500/70 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Dna className="w-4 h-4" /> Custom SMILES Input
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputSmiles}
              onChange={(e) => setInputSmiles(e.target.value)}
              className="flex-1 bg-black/30 border border-cyan-900/50 rounded px-3 py-2 text-sm text-cyan-100 focus:outline-none focus:border-neon-cyan font-mono"
              placeholder="Enter SMILES string (e.g., CC(=O)OC1=CC=CC=C1C(=O)O)"
            />
            <button
              onClick={() => setCustomSmiles(inputSmiles)}
              className="bg-cyan-900/50 hover:bg-cyan-800/50 text-cyan-100 px-4 py-2 rounded text-sm transition-colors uppercase tracking-wider font-bold"
            >
              Analyze
            </button>
          </div>
        </div>

        {/* 3D Visualization */}
        <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-4">
          <h3 className="text-xs text-cyan-500/70 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4" /> 3D Molecular Structure (SMILES: {customSmiles})
          </h3>
          <div className="w-full h-64 rounded-lg overflow-hidden relative">
            <MolecularViewer 
              smiles={customSmiles} 
              interactingResidues={dockingData?.interactingResidues} 
              receptor={receptor}
              fallbackName={formulation.closestMedicines?.[0]?.name}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* QSAR Results */}
          <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs text-cyan-500/70 uppercase tracking-widest flex items-center gap-2">
                <Beaker className="w-4 h-4" /> QSAR Predictions
              </h3>
              <select 
                className="bg-cyan-900/30 border border-cyan-900/50 text-cyan-100 text-xs rounded px-2 py-1 outline-none focus:border-neon-cyan"
                onChange={(e) => {
                  const compSmiles = e.target.value;
                  if (!compSmiles) {
                    setComparisonData(null);
                    setComparisonDockingData(null);
                    return;
                  }
                  fetch('/api/qsar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ smiles: compSmiles })
                  })
                    .then(async res => {
                      const contentType = res.headers.get("content-type");
                      if (!contentType || contentType.indexOf("application/json") === -1) {
                        throw new Error("QSAR response was not JSON");
                      }
                      return res.json();
                    })
                    .then(data => setComparisonData(data))
                    .catch(err => console.error(err));

                  fetch('/api/docking', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ smiles: compSmiles, receptor })
                  })
                    .then(async res => {
                      const contentType = res.headers.get("content-type");
                      if (!contentType || contentType.indexOf("application/json") === -1) {
                        throw new Error("Docking response was not JSON");
                      }
                      return res.json();
                    })
                    .then(data => setComparisonDockingData(data))
                    .catch(err => console.error(err));
                }}
              >
                <option value="">Compare with...</option>
                {formulation.baseSmiles && (
                  <option value={formulation.baseSmiles}>Base Compound (Pre-Mutation)</option>
                )}
                <option value="CC(=O)OC1=CC=CC=C1C(=O)O">Aspirin</option>
                <option value="CC(C)CC1=CC=C(C=C1)C(C)C(=O)O">Ibuprofen</option>
                <option value="CN1C=NC2=C1C(=O)N(C(=O)N2C)C">Caffeine</option>
              </select>
            </div>
            {loadingQsar ? (
              <div className="flex items-center justify-center h-32 text-cyan-500/50">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
            ) : qsarData?.error ? (
              <div className="flex flex-col items-center justify-center h-32 text-red-400 text-center p-4">
                <AlertTriangle className="w-6 h-6 mb-2" />
                <p className="text-xs">{qsarData.error}</p>
                <p className="text-[10px] mt-2 text-red-400/70">Deploy the Python Microservice to AWS/GCP to run real QSAR calculations.</p>
              </div>
            ) : qsarData ? (
              <div className="space-y-4">
                <div className="flex flex-col border-b border-cyan-900/30 pb-2">
                  <div className="flex justify-between mb-1">
                    <span className="text-cyan-500">Toxicity (LD50)</span>
                    <div className="text-right">
                      <span className="text-cyan-100">{qsarData.toxicityLD50} mg/kg</span>
                      {comparisonData && (
                        <span className="text-cyan-500/50 text-xs ml-2">vs {comparisonData.toxicityLD50}</span>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-cyan-950/50 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-red-400 h-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, (Number(qsarData.toxicityLD50) / 5000) * 100)}%` }}
                    />
                  </div>
                </div>
                <div className="flex flex-col border-b border-cyan-900/30 pb-2">
                  <div className="flex justify-between mb-1">
                    <span className="text-cyan-500">Solubility</span>
                    <div className="text-right">
                      <span className="text-cyan-100">{qsarData.solubility} mg/mL</span>
                      {comparisonData && (
                        <span className="text-cyan-500/50 text-xs ml-2">vs {comparisonData.solubility}</span>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-cyan-950/50 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-400 h-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, (Number(qsarData.solubility) / 100) * 100)}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-between border-b border-cyan-900/30 pb-2">
                  <span className="text-cyan-500">Clearance Rate</span>
                  <div className="text-right">
                    <span className="text-cyan-100">{qsarData.clearanceRate} mL/min/kg</span>
                    {comparisonData && (
                      <span className="text-cyan-500/50 text-xs ml-2">vs {comparisonData.clearanceRate}</span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between border-b border-cyan-900/30 pb-2">
                  <span className="text-cyan-500">LogP</span>
                  <div className="text-right">
                    <span className="text-cyan-100">{qsarData.logP}</span>
                    {comparisonData && (
                      <span className="text-cyan-500/50 text-xs ml-2">vs {comparisonData.logP}</span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-cyan-500/50 italic text-right mt-2">
                  Model: {qsarData.modelUsed}
                </div>
              </div>
            ) : (
              <div className="text-red-500 text-sm">Failed to load QSAR data</div>
            )}
          </div>

          {/* Docking Results */}
          <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-4">
            <h3 className="text-xs text-cyan-500/70 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Dna className="w-4 h-4" /> Molecular Docking (Target: {receptor})
            </h3>
            {loadingDocking ? (
              <div className="flex items-center justify-center h-32 text-cyan-500/50">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
            ) : dockingError ? (
              <div className="flex flex-col items-center justify-center h-32 text-center space-y-2">
                <AlertTriangle className="w-8 h-8 text-red-400" />
                <p className="text-xs text-red-400">{dockingError}</p>
                <p className="text-[10px] mt-2 text-red-400/70">Deploy the Python Microservice to AWS/GCP to run real AutoDock Vina simulations.</p>
              </div>
            ) : dockingData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-cyan-900/20 border border-cyan-900/50 rounded p-3 text-center">
                    <div className="text-xs text-cyan-500/70 uppercase mb-1">Binding Free Energy (ΔG)</div>
                    <div className="text-xl text-neon-green font-bold">
                      {dockingData.bindingEnergy} <span className="text-xs font-normal text-cyan-500">kcal/mol</span>
                    </div>
                    {comparisonDockingData && (
                      <div className="text-xs text-cyan-500/50 mt-1">vs {comparisonDockingData.bindingEnergy}</div>
                    )}
                  </div>
                  <div className="bg-cyan-900/20 border border-cyan-900/50 rounded p-3 text-center">
                    <div className="text-xs text-cyan-500/70 uppercase mb-1">Spatial Fit Score</div>
                    <div className="text-xl text-cyan-100 font-bold">
                      {dockingData.spatialFit}<span className="text-xs font-normal text-cyan-500">%</span>
                    </div>
                    {comparisonDockingData && (
                      <div className="text-xs text-cyan-500/50 mt-1">vs {comparisonDockingData.spatialFit}%</div>
                    )}
                  </div>
                </div>
                <div className="border-t border-cyan-900/30 pt-4 pb-2">
                  <span className="text-cyan-500 block mb-2 text-sm">Interacting Residues</span>
                  <div className="flex flex-wrap gap-2">
                    {dockingData.interactingResidues.map((res: string, i: number) => (
                      <span key={i} className="px-2 py-1 bg-cyan-900/30 border border-cyan-800 text-cyan-300 text-xs rounded">{res}</span>
                    ))}
                  </div>
                </div>
                <div className="text-xs text-cyan-500/50 italic text-right mt-2">
                  Model: {dockingData.modelUsed}
                </div>
              </div>
            ) : (
              <div className="text-red-500 text-sm">Failed to load Docking data</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-cyan-900/50 flex justify-between items-center">
        <button 
          onClick={onReset}
          disabled={loading}
          className="px-4 py-2 text-xs text-cyan-500/70 hover:text-cyan-100 uppercase tracking-widest flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <RefreshCw className="w-3 h-3" /> Abort & Restart
        </button>
        
        <div className="flex gap-4">
          {!formulation.optimizationLog && (
            <button 
              onClick={onOptimize}
              disabled={loading || loadingQsar || loadingDocking}
              className="group relative px-6 py-3 bg-neon-cyan/10 border border-neon-cyan text-neon-cyan text-sm uppercase tracking-widest hover:bg-neon-cyan hover:text-jarvis-bg transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
            >
              <div className="absolute inset-0 bg-neon-cyan/20 translate-x-full group-hover:translate-x-0 transition-transform"></div>
              <span className="relative flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Run Agentic Optimization
              </span>
            </button>
          )}
          
          <button 
            onClick={onNext}
            disabled={loading || loadingQsar || loadingDocking}
            className="group relative px-6 py-3 bg-cyan-950/50 border border-neon-cyan text-neon-cyan text-sm uppercase tracking-widest hover:bg-neon-cyan hover:text-jarvis-bg transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
          >
            <div className="absolute inset-0 bg-neon-cyan/20 translate-x-full group-hover:translate-x-0 transition-transform"></div>
            <span className="relative flex items-center gap-2">
              Proceed to Trial Simulation
              <ChevronRight className="w-4 h-4" />
            </span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
