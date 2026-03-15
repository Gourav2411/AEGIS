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
}

export default function PhysicsSimulationPanel({ formulation, receptor, onNext, onReset }: PhysicsSimulationPanelProps) {
  const [qsarData, setQsarData] = useState<any>(null);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [dockingData, setDockingData] = useState<any>(null);
  const [loadingQsar, setLoadingQsar] = useState(true);
  const [loadingDocking, setLoadingDocking] = useState(true);
  const [dockingError, setDockingError] = useState<string | null>(null);

  const smiles = formulation.smilesString || 'CC(=O)OC1=CC=CC=C1C(=O)O'; // Fallback to Aspirin if missing

  useEffect(() => {
    // Call QSAR Backend
    fetch('/api/qsar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ smiles })
    })
      .then(res => res.json())
      .then(data => {
        setQsarData(data);
        setLoadingQsar(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingQsar(false);
      });

    // Call Docking Backend
    setDockingError(null);
    fetch('/api/docking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ smiles, receptor })
    })
      .then(res => {
        if (!res.ok) throw new Error('Docking server responded with an error');
        return res.json();
      })
      .then(data => {
        setDockingData(data);
        setLoadingDocking(false);
      })
      .catch(err => {
        console.error(err);
        setDockingError('Failed to connect to the docking server. Please check your network connection or try a different receptor target.');
        setLoadingDocking(false);
      });
  }, [smiles, receptor]);

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
        {/* 3D Visualization */}
        <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-4">
          <h3 className="text-xs text-cyan-500/70 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4" /> 3D Molecular Structure (SMILES: {smiles})
          </h3>
          <div className="w-full h-64 rounded-lg overflow-hidden relative">
            <MolecularViewer 
              smiles={smiles} 
              interactingResidues={dockingData?.interactingResidues} 
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
                    return;
                  }
                  fetch('/api/qsar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ smiles: compSmiles })
                  })
                    .then(res => res.json())
                    .then(data => setComparisonData(data))
                    .catch(err => console.error(err));
                }}
              >
                <option value="">Compare with...</option>
                <option value="CC(=O)OC1=CC=CC=C1C(=O)O">Aspirin</option>
                <option value="CC(C)CC1=CC=C(C=C1)C(C)C(=O)O">Ibuprofen</option>
                <option value="CN1C=NC2=C1C(=O)N(C(=O)N2C)C">Caffeine</option>
              </select>
            </div>
            {loadingQsar ? (
              <div className="flex items-center justify-center h-32 text-cyan-500/50">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
            ) : qsarData ? (
              <div className="space-y-4">
                <div className="flex justify-between border-b border-cyan-900/30 pb-2">
                  <span className="text-cyan-500">Toxicity (LD50)</span>
                  <div className="text-right">
                    <span className="text-cyan-100">{qsarData.toxicityLD50} mg/kg</span>
                    {comparisonData && (
                      <span className="text-cyan-500/50 text-xs ml-2">vs {comparisonData.toxicityLD50}</span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between border-b border-cyan-900/30 pb-2">
                  <span className="text-cyan-500">Solubility</span>
                  <div className="text-right">
                    <span className="text-cyan-100">{qsarData.solubility} mg/mL</span>
                    {comparisonData && (
                      <span className="text-cyan-500/50 text-xs ml-2">vs {comparisonData.solubility}</span>
                    )}
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
              </div>
            ) : dockingData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-cyan-900/20 border border-cyan-900/50 rounded p-3 text-center">
                    <div className="text-xs text-cyan-500/70 uppercase mb-1">Binding Free Energy (ΔG)</div>
                    <div className="text-xl text-neon-green font-bold">{dockingData.bindingEnergy} <span className="text-xs font-normal text-cyan-500">kcal/mol</span></div>
                  </div>
                  <div className="bg-cyan-900/20 border border-cyan-900/50 rounded p-3 text-center">
                    <div className="text-xs text-cyan-500/70 uppercase mb-1">Spatial Fit Score</div>
                    <div className="text-xl text-cyan-100 font-bold">{dockingData.spatialFit}<span className="text-xs font-normal text-cyan-500">%</span></div>
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
          className="px-4 py-2 text-xs text-cyan-500/70 hover:text-cyan-100 uppercase tracking-widest flex items-center gap-2 transition-colors"
        >
          <RefreshCw className="w-3 h-3" /> Abort & Restart
        </button>
        
        <button 
          onClick={onNext}
          disabled={loadingQsar || loadingDocking}
          className="group relative px-6 py-3 bg-cyan-950/50 border border-neon-cyan text-neon-cyan text-sm uppercase tracking-widest hover:bg-neon-cyan hover:text-jarvis-bg transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
        >
          <div className="absolute inset-0 bg-neon-cyan/20 translate-x-full group-hover:translate-x-0 transition-transform"></div>
          <span className="relative flex items-center gap-2">
            Proceed to Trial Simulation
            <ChevronRight className="w-4 h-4" />
          </span>
        </button>
      </div>
    </motion.div>
  );
}
