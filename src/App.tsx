import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Activity, Beaker, Dna, Package, ShieldAlert, Cpu, Database, Network } from 'lucide-react';
import { generateFormulation, simulateTrial, generatePackaging, FormulationResult, TrialResult, PackagingResult } from './services/geminiService';
import InputPanel from './components/InputPanel';
import FormulationPanel from './components/FormulationPanel';
import TrialPanel from './components/TrialPanel';
import PackagingPanel from './components/PackagingPanel';
import Visualizer from './components/Visualizer';

export type Step = 'input' | 'formulation' | 'trial' | 'packaging';

export interface FormData {
  disease: string;
  cureRequired: string;
  category: string;
  receptors: string;
}

export default function App() {
  const [step, setStep] = useState<Step>('input');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  
  const [formData, setFormData] = useState<FormData>({
    disease: '',
    cureRequired: '',
    category: 'Small Molecule',
    receptors: ''
  });

  const [formulationResult, setFormulationResult] = useState<FormulationResult | null>(null);
  const [trialResult, setTrialResult] = useState<TrialResult | null>(null);
  const [packagingResult, setPackagingResult] = useState<PackagingResult | null>(null);

  const handleGenerateFormulation = async (data: FormData) => {
    setFormData(data);
    setLoading(true);
    setLoadingText('Synthesizing novel molecular structures...');
    try {
      const result = await generateFormulation(data.disease, data.cureRequired, data.category, data.receptors);
      setFormulationResult(result);
      setStep('formulation');
    } catch (error) {
      console.error("Formulation error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateTrial = async () => {
    if (!formulationResult) return;
    setLoading(true);
    setLoadingText('Running in-silico and in-vitro simulations...');
    try {
      const result = await simulateTrial(formulationResult.name, formulationResult.mechanismOfAction);
      setTrialResult(result);
      setStep('trial');
    } catch (error) {
      console.error("Trial error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePackaging = async () => {
    if (!formulationResult) return;
    setLoading(true);
    setLoadingText('Designing supply chain and packaging protocols...');
    try {
      const result = await generatePackaging(formulationResult.name, formData.category);
      setPackagingResult(result);
      setStep('packaging');
    } catch (error) {
      console.error("Packaging error:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetSystem = () => {
    setStep('input');
    setFormulationResult(null);
    setTrialResult(null);
    setPackagingResult(null);
    setFormData({ disease: '', cureRequired: '', category: 'Small Molecule', receptors: '' });
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="scanline"></div>
      
      {/* Background Grid */}
      <div className="absolute inset-0 z-0 opacity-20" 
           style={{ backgroundImage: 'linear-gradient(rgba(0, 240, 255, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.2) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      {/* Header */}
      <header className="relative z-10 glass-panel border-b border-t-0 border-x-0 border-jarvis-border p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Cpu className="text-neon-cyan w-8 h-8" />
          <div>
            <h1 className="text-2xl font-mono font-bold tracking-widest neon-text-cyan uppercase">Aegis</h1>
            <p className="text-xs font-mono text-cyan-500/70 tracking-widest uppercase">AI Drug Discovery Command Center</p>
          </div>
        </div>
        
        <div className="flex gap-6 font-mono text-xs text-cyan-500/70">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            <span>SYS.ONLINE</span>
          </div>
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4" />
            <span>NEURAL.LINK: ACTIVE</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 p-6 h-[calc(100vh-80px)] flex flex-col lg:flex-row gap-6">
        
        {/* Left Panel - Visualizer */}
        <div className="w-full lg:w-1/3 h-full flex flex-col gap-6">
          <div className="glass-panel flex-1 rounded-xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
            <Visualizer step={step} loading={loading} />
            
            {/* Status Overlay */}
            <div className="absolute bottom-4 left-4 right-4 font-mono text-xs">
              <div className="flex justify-between text-cyan-500/70 mb-1">
                <span>SYSTEM STATUS</span>
                <span>{loading ? 'PROCESSING' : 'IDLE'}</span>
              </div>
              <div className="h-1 bg-jarvis-bg rounded overflow-hidden">
                <motion.div 
                  className="h-full bg-neon-cyan"
                  initial={{ width: "0%" }}
                  animate={{ width: loading ? "100%" : "0%" }}
                  transition={{ duration: 2, repeat: loading ? Infinity : 0 }}
                />
              </div>
              {loading && <p className="mt-2 text-center text-neon-cyan animate-pulse">{loadingText}</p>}
            </div>
          </div>
          
          {/* Progress Steps */}
          <div className="glass-panel rounded-xl p-4 flex justify-between items-center font-mono text-xs">
             {[
               { id: 'input', icon: Dna, label: 'DISCOVERY' },
               { id: 'formulation', icon: Beaker, label: 'SYNTHESIS' },
               { id: 'trial', icon: Activity, label: 'SIMULATION' },
               { id: 'packaging', icon: Package, label: 'LOGISTICS' }
             ].map((s, i) => (
               <div key={s.id} className={`flex flex-col items-center gap-2 ${step === s.id ? 'text-neon-cyan' : 'text-cyan-500/40'}`}>
                 <div className={`p-2 rounded-full ${step === s.id ? 'neon-border bg-cyan-900/30' : 'border border-cyan-900/30'}`}>
                   <s.icon className="w-4 h-4" />
                 </div>
                 <span className="hidden sm:block">{s.label}</span>
               </div>
             ))}
          </div>
        </div>

        {/* Right Panel - Dynamic Content */}
        <div className="w-full lg:w-2/3 h-full glass-panel rounded-xl p-6 overflow-y-auto">
          {step === 'input' && (
            <InputPanel onSubmit={handleGenerateFormulation} loading={loading} />
          )}
          
          {step === 'formulation' && formulationResult && (
            <FormulationPanel 
              result={formulationResult} 
              onNext={handleSimulateTrial} 
              onReset={resetSystem}
              loading={loading} 
            />
          )}

          {step === 'trial' && trialResult && (
            <TrialPanel 
              result={trialResult} 
              onNext={handleGeneratePackaging} 
              onReset={resetSystem}
              loading={loading} 
            />
          )}

          {step === 'packaging' && packagingResult && (
            <PackagingPanel 
              result={packagingResult} 
              onReset={resetSystem} 
            />
          )}
        </div>
      </main>
    </div>
  );
}
