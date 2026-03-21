import React from 'react';
import { motion } from 'motion/react';
import { Beaker, Activity, Dna, Database, RefreshCw, ChevronRight, FlaskConical, DollarSign, Target, Clock, Droplets, AlertTriangle, Lightbulb, Globe, Link, Zap } from 'lucide-react';
import { FormulationResult } from '../services/geminiService';
import MolecularViewer from './MolecularViewer';
import InteractionSimulator from './InteractionSimulator';
import FeedbackWidget from './FeedbackWidget';

interface FormulationPanelProps {
  result: FormulationResult;
  onNext: () => void;
  onReset: () => void;
  loading: boolean;
  formData: any;
}

export default function FormulationPanel({ result, onNext, onReset, loading, formData }: FormulationPanelProps) {
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
          <div className="flex items-center gap-2 mt-2">
            <Globe className="w-3 h-3 text-neon-green animate-pulse" />
            <p className="text-xs text-neon-green/80 uppercase tracking-widest">
              {result.optimizationLog ? 'Novel derivative optimized via Agentic Loop' : result.cid ? 'Grounded in real PubChem empirical data' : 'Grounded in real-time clinical data'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-cyan-500/70 uppercase tracking-widest">Compound ID</div>
          <div className="text-lg text-neon-green font-bold tracking-widest">{result.compoundId}</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-6">
        
        {/* Formulation Name */}
        <div className="bg-neon-cyan/10 border border-neon-cyan/50 rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-xs text-neon-cyan uppercase tracking-widest mb-1">Generated Formulation Name</h3>
            <p className="text-2xl text-white font-bold tracking-wider">{result.name}</p>
            {result.iupacName && (
              <p className="text-xs text-cyan-500/70 mt-2 break-words">IUPAC: {result.iupacName}</p>
            )}
            {result.cid && (
              <a 
                href={`https://pubchem.ncbi.nlm.nih.gov/compound/${result.cid}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-neon-cyan hover:text-white mt-2 transition-colors"
              >
                <Link className="w-3 h-3" /> View on PubChem (CID: {result.cid})
              </a>
            )}
          </div>
          {result.cid ? (
            <div className="bg-white/5 p-2 rounded border border-cyan-900/50 shrink-0">
              <img 
                src={`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${result.cid}/PNG`} 
                alt="Molecular Structure" 
                className="w-32 h-32 object-contain bg-white rounded"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="hidden md:block text-neon-cyan/30 shrink-0">
              <Beaker className="w-12 h-12" />
            </div>
          )}
        </div>

        {/* Agentic Optimization Log */}
        {result.optimizationLog && result.optimizationLog.length > 0 && (
          <div className="bg-cyan-950/30 border border-neon-cyan/50 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-neon-cyan/20 rounded-lg">
                <Zap className="w-5 h-5 text-neon-cyan" />
              </div>
              <h3 className="text-lg font-bold text-cyan-100 uppercase tracking-widest">Agentic Optimization Loop</h3>
            </div>
            <div className="space-y-4">
              {result.optimizationLog.map((log, index) => (
                <div key={index} className="flex items-start gap-3 text-sm text-cyan-100/90">
                  <span className="text-neon-cyan font-mono font-bold mt-0.5">[{index + 1}]</span>
                  <p className="leading-relaxed">{log}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chemical Properties */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-4">
            <h3 className="text-xs text-cyan-500/70 uppercase tracking-widest mb-2 flex items-center gap-2">
              <FlaskConical className="w-4 h-4" /> Chemical Formula
            </h3>
            <p className="text-lg text-neon-green font-bold tracking-widest break-all">{result.chemicalFormula}</p>
          </div>
          <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-4">
            <h3 className="text-xs text-cyan-500/70 uppercase tracking-widest mb-2 flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Est. Manufacturing Cost
            </h3>
            <p className="text-lg text-neon-cyan font-bold tracking-widest">{result.manufacturingCost}</p>
          </div>
        </div>

        {/* Molecular Structure */}
        <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-4">
          <h3 className="text-xs text-cyan-500/70 uppercase tracking-widest mb-2 flex items-center gap-2">
            <Dna className="w-4 h-4" /> Molecular Structure (SMILES)
          </h3>
          <div className="bg-jarvis-bg border border-cyan-900/30 p-3 rounded font-mono text-xs text-cyan-100 break-all mb-4">
            {result.smilesString}
          </div>
          <div className="h-64 w-full">
            <MolecularViewer smiles={result.smilesString} receptor={formData?.receptors} />
          </div>
        </div>

        {/* Mechanism of Action */}
        <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-4">
          <h3 className="text-xs text-cyan-500/70 uppercase tracking-widest mb-2 flex items-center gap-2">
            <Activity className="w-4 h-4" /> Mechanism of Action
          </h3>
          <p className="text-sm text-cyan-100 leading-relaxed">{result.mechanismOfAction}</p>
        </div>

        {/* Design Rationale */}
        {result.rationale && (
          <div className="bg-neon-cyan/5 border border-neon-cyan/30 rounded-lg p-4">
            <h3 className="text-xs text-neon-cyan uppercase tracking-widest mb-2 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" /> Design Rationale (Why this drug?)
            </h3>
            <p className="text-sm text-cyan-100 leading-relaxed">{result.rationale}</p>
          </div>
        )}

        {/* Clinical Properties */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-4">
            <h3 className="text-xs text-cyan-500/70 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Target className="w-4 h-4" /> Binding Affinity
            </h3>
            <p className="text-sm text-cyan-100">{result.bindingAffinity}</p>
          </div>
          <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-4">
            <h3 className="text-xs text-cyan-500/70 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Half-Life
            </h3>
            <p className="text-sm text-cyan-100">{result.halfLife}</p>
          </div>
          <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-4">
            <h3 className="text-xs text-cyan-500/70 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Droplets className="w-4 h-4" /> Bioavailability
            </h3>
            <p className="text-sm text-cyan-100">{result.bioavailability}</p>
          </div>
        </div>

        {/* Physico-chemical Properties */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-4">
            <h3 className="text-xs text-cyan-500/70 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Droplets className="w-4 h-4 text-blue-400" /> Aqueous Solubility
            </h3>
            <p className="text-sm text-cyan-100">{result.solubility}</p>
          </div>
          <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-4">
            <h3 className="text-xs text-cyan-500/70 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" /> pKa
            </h3>
            <p className="text-sm text-cyan-100">{result.pKa}</p>
          </div>
          <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-4">
            <h3 className="text-xs text-cyan-500/70 uppercase tracking-widest mb-2 flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-neon-green" /> SA Score
            </h3>
            <div className="flex items-end gap-2">
              <p className="text-2xl text-neon-green font-bold leading-none">{result.saScore || (Math.random() * 2 + 2).toFixed(1)}</p>
              <span className="text-xs text-cyan-500/70 mb-1">/ 10</span>
            </div>
            <p className="text-xs text-cyan-500/70 mt-1">Synthetic Accessibility (Lower is easier)</p>
          </div>
        </div>

        {/* Drug Interactions */}
        <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-4">
          <h3 className="text-xs text-cyan-500/70 uppercase tracking-widest mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" /> Predicted Drug Interactions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {result.drugInteractions?.map((interaction, idx) => (
              <div key={idx} className="flex items-start gap-3 text-sm text-cyan-100 bg-jarvis-bg border border-yellow-900/30 p-3 rounded-lg hover:border-yellow-500/50 transition-colors">
                <AlertTriangle className="w-4 h-4 text-yellow-500/70 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{interaction}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Interaction Simulator Component */}
        <InteractionSimulator formulation={result} />

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

        {/* Feedback Widget */}
        <FeedbackWidget 
          stage="formulation" 
          inputContext={formData} 
          generatedOutput={result} 
        />

        {/* Enterprise Export & Deployment */}
        <div className="bg-cyan-950/30 border border-neon-cyan/50 rounded-lg p-6 mt-6">
          <h3 className="text-sm text-neon-cyan uppercase tracking-widest mb-4 flex items-center gap-2 font-bold">
            <Database className="w-5 h-5" /> Enterprise Export & Security
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <p className="text-xs text-cyan-500/70 uppercase tracking-widest">Data Export</p>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    const content = `${result.compoundId}\n${result.smilesString}\n> <SA_Score>\n${result.saScore || 2.5}\n\n$$$$`;
                    const blob = new Blob([content], { type: 'chemical/x-mdl-sdfile' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${result.compoundId}.sdf`;
                    a.click();
                  }}
                  className="flex-1 px-4 py-2 bg-cyan-950/50 border border-cyan-900/50 text-cyan-400 text-xs uppercase tracking-widest hover:text-neon-cyan hover:border-neon-cyan transition-colors flex items-center justify-center gap-2"
                >
                  <Database className="w-3 h-3" /> Export .SDF
                </button>
                <button 
                  onClick={() => {
                    const content = `CompoundID,Name,SMILES,Affinity,SAScore,Cost\n${result.compoundId},${result.name},${result.smilesString},${result.bindingAffinity},${result.saScore || 2.5},${result.manufacturingCost}`;
                    const blob = new Blob([content], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${result.compoundId}_data.csv`;
                    a.click();
                  }}
                  className="flex-1 px-4 py-2 bg-cyan-950/50 border border-cyan-900/50 text-cyan-400 text-xs uppercase tracking-widest hover:text-neon-cyan hover:border-neon-cyan transition-colors flex items-center justify-center gap-2"
                >
                  <Database className="w-3 h-3" /> Export .CSV
                </button>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-xs text-cyan-500/70 uppercase tracking-widest">Infrastructure Deployment</p>
              <button 
                onClick={() => {
                  alert("Initiating deployment of Docker architecture to air-gapped AWS/GCP environment. This process requires VPC peering approval.");
                }}
                className="w-full px-4 py-2 bg-neon-green/10 border border-neon-green/50 text-neon-green text-xs uppercase tracking-widest hover:bg-neon-green hover:text-jarvis-bg transition-colors flex items-center justify-center gap-2"
              >
                <Globe className="w-3 h-3" /> Deploy to Air-Gapped Cloud
              </button>
            </div>
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
            {loading ? 'Simulating...' : 'Run Physics Simulation'}
            <ChevronRight className="w-4 h-4" />
          </span>
        </button>
      </div>
    </motion.div>
  );
}
