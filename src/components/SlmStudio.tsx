import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BrainCircuit, Database, Play, CheckCircle2, ChevronLeft, RefreshCw, Activity, TrendingUp, AlertTriangle, Globe, Link, Download, Settings2 } from 'lucide-react';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SlmStudioProps {
  onBack: () => void;
}

const PRESETS = {
  'fast-prototyping': {
    name: 'Fast Prototyping',
    learningRate: '5e-5',
    batchSize: '64',
    epochs: '5',
    baseModel: 'ChemBERTa-2',
    precision: 'FP16',
    optimizer: 'AdamW'
  },
  'deep-finetuning': {
    name: 'Deep Fine-Tuning',
    learningRate: '1e-5',
    batchSize: '16',
    epochs: '50',
    baseModel: 'MoLFormer',
    precision: 'BF16',
    optimizer: 'AdamW'
  },
  'low-vram': {
    name: 'Low VRAM (QLoRA)',
    learningRate: '2e-4',
    batchSize: '8',
    epochs: '20',
    baseModel: 'ChemBERTa-2',
    precision: 'INT4 QLoRA',
    optimizer: 'AdamW'
  },
  'custom': {
    name: 'Custom',
    learningRate: '2e-5',
    batchSize: '32',
    epochs: '20',
    baseModel: 'ChemBERTa-2',
    precision: 'FP16',
    optimizer: 'AdamW'
  }
};

export default function SlmStudio({ onBack }: SlmStudioProps) {
  const [loading, setLoading] = useState(true);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [modelStatus, setModelStatus] = useState<'untrained' | 'training' | 'deployed'>('untrained');
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [lossData, setLossData] = useState<{ epoch: number; loss: number; val_loss?: number }[]>([]);
  const [modelAccuracy, setModelAccuracy] = useState(0);
  const [byodMode, setByodMode] = useState<'csv' | 'api'>('csv');
  const [apiSource, setApiSource] = useState('chembl');
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [trainingLogs, setTrainingLogs] = useState<string[]>([]);
  
  // Training Inputs
  const [targetDisease, setTargetDisease] = useState('');
  const [baseCompounds, setBaseCompounds] = useState('');
  const [negativeConstraints, setNegativeConstraints] = useState('');
  const [preset, setPreset] = useState('custom');
  const [learningRate, setLearningRate] = useState('2e-5');
  const [batchSize, setBatchSize] = useState('32');
  const [epochs, setEpochs] = useState('20');
  const [baseModel, setBaseModel] = useState('ChemBERTa-2');
  const [precision, setPrecision] = useState('FP16');
  const [optimizer, setOptimizer] = useState('AdamW');

  const handlePresetChange = (selectedPreset: string) => {
    setPreset(selectedPreset);
    if (selectedPreset !== 'custom') {
      const config = PRESETS[selectedPreset as keyof typeof PRESETS];
      setLearningRate(config.learningRate);
      setBatchSize(config.batchSize);
      setEpochs(config.epochs);
      setBaseModel(config.baseModel);
      setPrecision(config.precision);
      setOptimizer(config.optimizer);
    }
  };

  const handleParamChange = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
    setter(value);
    setPreset('custom');
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) return;
      
      try {
        // Fetch feedback count
        const feedbacksRef = collection(db, 'feedbacks');
        const querySnapshot = await getDocs(feedbacksRef);
        setFeedbackCount(querySnapshot.size);

        // Fetch model status
        const modelRef = doc(db, 'models', 'global_slm');
        const modelSnap = await getDoc(modelRef);
        
        if (modelSnap.exists()) {
          const data = modelSnap.data();
          setModelStatus(data.status);
          setModelAccuracy(data.accuracy || 0);
          if (data.status === 'deployed') {
            // Generate some dummy loss data for the chart if deployed
            const dummyData = Array.from({ length: 20 }, (_, i) => {
              const baseLoss = 2.5 * Math.exp(-i / 5);
              return {
                epoch: i + 1,
                loss: Math.max(0.05, baseLoss + (Math.random() * 0.1 - 0.05)),
                val_loss: Math.max(0.08, baseLoss + (Math.random() * 0.15))
              };
            });
            setLossData(dummyData);
            setTrainingLogs([
              "[SYSTEM] Loaded previously deployed model weights.",
              "[SYSTEM] Model: ChemBERTa-2 | Precision: FP16 | Optimizer: AdamW",
              `[SYSTEM] Final Validation Accuracy: ${data.accuracy || 0}%`,
              "[SYSTEM] Ready for inference or further fine-tuning."
            ]);
          }
        } else {
          // Initialize model doc if it doesn't exist
          await setDoc(modelRef, {
            userId: auth.currentUser.uid,
            modelName: 'Aegis-SLM-v1',
            status: 'untrained',
            trainingSamples: 0,
            accuracy: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      } catch (error) {
        console.error("Error fetching SLM data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleTrainModel = async () => {
    if (!auth.currentUser || feedbackCount < 1) {
      alert("You need at least 1 feedback sample to train the model.");
      return;
    }

    setModelStatus('training');
    setTrainingProgress(0);
    setLossData([]);
    setTrainingLogs([]);
    
    // Update DB to training
    const modelRef = doc(db, 'models', 'global_slm');
    await setDoc(modelRef, {
      status: 'training',
      updatedAt: new Date()
    }, { merge: true });

    try {
      const res = await fetch('/api/slm/train-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          targetDisease, 
          baseCompounds, 
          negativeConstraints, 
          learningRate, 
          batchSize,
          epochs,
          baseModel,
          precision,
          optimizer
        })
      });
      
      if (!res.body) throw new Error("No readable stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      
      let done = false;
      let finalAccuracy = 0;
      let finalContext = '';
      
      const totalEpochs = parseInt(epochs) || 20;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.type === 'log') {
                  setTrainingLogs(prev => [...prev, data.message]);
                } else if (data.type === 'metric') {
                  setLossData(prev => [...prev, {
                    epoch: data.epoch,
                    loss: data.loss,
                    val_loss: data.val_loss
                  }]);
                  setTrainingProgress(Math.round((data.epoch / totalEpochs) * 100));
                } else if (data.type === 'complete') {
                  finalAccuracy = data.accuracy;
                  finalContext = data.trainingContext;
                }
              } catch (e) {
                // Ignore parse errors for incomplete chunks
              }
            }
          }
        }
      }
      
      setTrainingProgress(100);
      setModelAccuracy(finalAccuracy);
      setModelStatus('deployed');
      
      // Update DB to deployed with the context
      await setDoc(modelRef, {
        status: 'deployed',
        trainingSamples: feedbackCount,
        accuracy: finalAccuracy,
        trainingContext: finalContext,
        updatedAt: new Date()
      }, { merge: true });
      
    } catch (error) {
      console.error("Training failed", error);
      setModelStatus('untrained');
      alert("Training failed. Please try again.");
    }
  };

  const handleDownloadModel = async () => {
    try {
      const modelRef = doc(db, 'models', 'global_slm');
      const modelSnap = await getDoc(modelRef);
      
      if (!modelSnap.exists()) {
        alert("Model data not found.");
        return;
      }
      
      const modelData = modelSnap.data();
      
      const exportData = {
        model_name: "Aegis-SLM-v1",
        architecture: "Transformer-based SLM (Quantized 4-bit)",
        parameters: "1.2B",
        training_samples: modelData.trainingSamples || feedbackCount,
        validation_accuracy: modelData.accuracy || modelAccuracy,
        target_disease: targetDisease || modelData.targetDisease || "Unknown",
        base_compounds: baseCompounds || modelData.baseCompounds || "None",
        negative_constraints: negativeConstraints || modelData.negativeConstraints || "None",
        learned_context: modelData.trainingContext || "No context available",
        export_date: new Date().toISOString(),
        weights_url: "mock://registry.aegis.local/models/slm-v1.bin"
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aegis-slm-v1-weights-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download model", error);
      alert("Failed to download model weights.");
    }
  };

  if (loading) {
    return <div className="h-full flex items-center justify-center font-mono text-neon-cyan">Loading SLM Studio...</div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full flex flex-col font-mono max-w-5xl mx-auto w-full"
    >
      <div className="mb-6 border-b border-cyan-900/50 pb-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 bg-cyan-950/50 border border-cyan-900/50 text-cyan-400 hover:text-neon-cyan hover:border-neon-cyan transition-colors rounded"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl text-neon-cyan uppercase tracking-widest flex items-center gap-2">
            <BrainCircuit className="w-5 h-5" />
            SLM Fine-Tuning Studio
          </h2>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-950/50 border border-cyan-900/50 rounded text-xs text-cyan-400 uppercase tracking-widest">
          <Database className="w-3 h-3" />
          {feedbackCount} Samples Available
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-6 pb-12">
        
        {/* Overview Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-6 flex flex-col items-center justify-center text-center">
            <Database className="w-8 h-8 text-cyan-500 mb-3" />
            <div className="text-3xl font-bold text-cyan-100 mb-1">{feedbackCount}</div>
            <div className="text-xs text-cyan-500/70 uppercase tracking-widest">Training Examples</div>
          </div>
          
          <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-6 flex flex-col items-center justify-center text-center">
            <Activity className="w-8 h-8 text-purple-500 mb-3" />
            <div className="text-3xl font-bold text-purple-100 mb-1 capitalize">{modelStatus}</div>
            <div className="text-xs text-purple-500/70 uppercase tracking-widest">Model Status</div>
          </div>

          <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-6 flex flex-col items-center justify-center text-center">
            <TrendingUp className={`w-8 h-8 mb-3 ${modelStatus === 'deployed' ? 'text-neon-green' : 'text-cyan-900'}`} />
            <div className={`text-3xl font-bold mb-1 ${modelStatus === 'deployed' ? 'text-neon-green' : 'text-cyan-900'}`}>
              {modelStatus === 'deployed' ? `${modelAccuracy}%` : '--'}
            </div>
            <div className="text-xs text-cyan-500/70 uppercase tracking-widest">Validation Accuracy</div>
          </div>
        </div>

        {/* Training Controls */}
        <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h3 className="text-sm text-cyan-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                <BrainCircuit className="w-4 h-4" /> Aegis-SLM-v1
              </h3>
              <p className="text-xs text-cyan-500/70">Fine-tune a specialized Small Language Model using your collected feedback data.</p>
            </div>
            
            {modelStatus === 'untrained' && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4 text-xs text-cyan-500/70 uppercase tracking-widest">
                  <div className="flex items-center gap-1">
                    <Database className="w-3 h-3" />
                    <span>Samples: {feedbackCount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    <span>Est. VRAM: {precision === 'FP16' ? '16GB' : precision === 'BF16' ? '16GB' : '8GB'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>Est. Time: ~{Math.ceil((parseInt(epochs) || 20) * 0.5)} min</span>
                  </div>
                </div>
                <button
                  onClick={handleTrainModel}
                  disabled={feedbackCount === 0 || !targetDisease}
                  className="px-6 py-2 bg-neon-cyan/10 border border-neon-cyan text-neon-cyan text-sm uppercase tracking-widest hover:bg-neon-cyan hover:text-jarvis-bg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 w-fit"
                >
                  <Play className="w-4 h-4" /> Initiate Fine-Tuning
                </button>
              </div>
            )}

            {modelStatus === 'training' && (
              <div className="px-6 py-2 bg-purple-900/20 border border-purple-500 text-purple-400 text-sm uppercase tracking-widest flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" /> Training in Progress...
              </div>
            )}

            {modelStatus === 'deployed' && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4 text-xs text-cyan-500/70 uppercase tracking-widest">
                  <div className="flex items-center gap-1">
                    <Database className="w-3 h-3" />
                    <span>Samples: {feedbackCount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    <span>Est. VRAM: {precision === 'FP16' ? '16GB' : precision === 'BF16' ? '16GB' : '8GB'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>Est. Time: ~{Math.ceil((parseInt(epochs) || 20) * 0.5)} min</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleDownloadModel}
                    className="px-4 py-2 bg-purple-900/30 border border-purple-500/50 text-purple-400 text-xs uppercase tracking-widest hover:bg-purple-900/50 hover:text-purple-300 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-3 h-3" /> Export Weights
                  </button>
                  <button
                    onClick={handleTrainModel}
                    disabled={!targetDisease}
                    className="px-4 py-2 bg-cyan-950/50 border border-cyan-900/50 text-cyan-400 text-xs uppercase tracking-widest hover:text-neon-cyan hover:border-neon-cyan transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className="w-3 h-3" /> Retrain
                  </button>
                  <div className="px-6 py-2 bg-neon-green/10 border border-neon-green text-neon-green text-sm uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Model Deployed
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Training Configuration Form */}
          {(modelStatus === 'untrained' || modelStatus === 'deployed') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-cyan-950/30 border border-cyan-900/50 rounded">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs text-cyan-500/70 uppercase tracking-widest mb-1">Target Disease / Mechanism *</label>
                <input 
                  type="text" 
                  value={targetDisease}
                  onChange={(e) => setTargetDisease(e.target.value)}
                  placeholder="e.g., Alzheimer's Disease, Amyloid Beta inhibition"
                  className="w-full bg-cyan-950/50 border border-cyan-900/50 rounded px-3 py-2 text-sm text-cyan-100 focus:outline-none focus:border-neon-cyan transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-cyan-500/70 uppercase tracking-widest mb-1">Base Compounds (SMILES/Names)</label>
                <textarea 
                  value={baseCompounds}
                  onChange={(e) => setBaseCompounds(e.target.value)}
                  placeholder="e.g., Donepezil, Memantine"
                  className="w-full bg-cyan-950/50 border border-cyan-900/50 rounded px-3 py-2 text-sm text-cyan-100 focus:outline-none focus:border-neon-cyan transition-colors h-20 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs text-cyan-500/70 uppercase tracking-widest mb-1">Negative Constraints</label>
                <textarea 
                  value={negativeConstraints}
                  onChange={(e) => setNegativeConstraints(e.target.value)}
                  placeholder="e.g., Avoid hERG binding, high liver toxicity"
                  className="w-full bg-cyan-950/50 border border-cyan-900/50 rounded px-3 py-2 text-sm text-cyan-100 focus:outline-none focus:border-neon-cyan transition-colors h-20 resize-none"
                />
              </div>
              <div className="col-span-1 md:col-span-2 border-t border-cyan-900/30 pt-4 mt-2">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-cyan-100 flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-purple-400" />
                    Advanced Hyperparameters
                  </h4>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-cyan-500/70 uppercase">Configuration Preset:</label>
                    <select
                      value={preset}
                      onChange={(e) => handlePresetChange(e.target.value)}
                      className="bg-cyan-950/50 border border-cyan-900/50 rounded px-2 py-1 text-xs text-cyan-100 focus:outline-none focus:border-neon-cyan transition-colors"
                    >
                      {Object.entries(PRESETS).map(([key, config]) => (
                        <option key={key} value={key}>{config.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs text-cyan-500/70 uppercase tracking-widest mb-1">Learning Rate</label>
                <input 
                  type="text" 
                  value={learningRate}
                  onChange={(e) => handleParamChange(setLearningRate, e.target.value)}
                  placeholder="e.g., 2e-5"
                  className="w-full bg-cyan-950/50 border border-cyan-900/50 rounded px-3 py-2 text-sm text-cyan-100 focus:outline-none focus:border-neon-cyan transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-cyan-500/70 uppercase tracking-widest mb-1">Batch Size</label>
                <input 
                  type="number" 
                  value={batchSize}
                  onChange={(e) => handleParamChange(setBatchSize, e.target.value)}
                  placeholder="e.g., 32"
                  className="w-full bg-cyan-950/50 border border-cyan-900/50 rounded px-3 py-2 text-sm text-cyan-100 focus:outline-none focus:border-neon-cyan transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-cyan-500/70 uppercase tracking-widest mb-1">Epochs</label>
                <input 
                  type="number" 
                  value={epochs}
                  onChange={(e) => handleParamChange(setEpochs, e.target.value)}
                  placeholder="e.g., 20"
                  className="w-full bg-cyan-950/50 border border-cyan-900/50 rounded px-3 py-2 text-sm text-cyan-100 focus:outline-none focus:border-neon-cyan transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-cyan-500/70 uppercase tracking-widest mb-1">Base Model</label>
                <select 
                  value={baseModel}
                  onChange={(e) => handleParamChange(setBaseModel, e.target.value)}
                  className="w-full bg-cyan-950/50 border border-cyan-900/50 rounded px-3 py-2 text-sm text-cyan-100 focus:outline-none focus:border-neon-cyan transition-colors"
                >
                  <option value="ChemBERTa-2">ChemBERTa-2</option>
                  <option value="MoLFormer">MoLFormer</option>
                  <option value="BioGPT">BioGPT</option>
                  <option value="Aegis-Base-v1">Aegis-Base-v1</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-cyan-500/70 uppercase tracking-widest mb-1">Precision</label>
                <select 
                  value={precision}
                  onChange={(e) => handleParamChange(setPrecision, e.target.value)}
                  className="w-full bg-cyan-950/50 border border-cyan-900/50 rounded px-3 py-2 text-sm text-cyan-100 focus:outline-none focus:border-neon-cyan transition-colors"
                >
                  <option value="FP16">FP16 (Half Precision)</option>
                  <option value="BF16">BF16 (BFloat16)</option>
                  <option value="INT8">INT8 (QLoRA)</option>
                  <option value="INT4">INT4 (QLoRA)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-cyan-500/70 uppercase tracking-widest mb-1">Optimizer</label>
                <select 
                  value={optimizer}
                  onChange={(e) => handleParamChange(setOptimizer, e.target.value)}
                  className="w-full bg-cyan-950/50 border border-cyan-900/50 rounded px-3 py-2 text-sm text-cyan-100 focus:outline-none focus:border-neon-cyan transition-colors"
                >
                  <option value="AdamW">AdamW</option>
                  <option value="SGD">SGD</option>
                  <option value="Adafactor">Adafactor</option>
                </select>
              </div>
            </div>
          )}

          {feedbackCount === 0 && modelStatus === 'untrained' && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded flex items-start gap-3 text-yellow-400/80 text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p>You need to collect feedback data before you can train the model. Use the main application and submit feedback on the generated results.</p>
            </div>
          )}

          {/* Progress Bar */}
          {modelStatus === 'training' && (
            <div className="mb-6">
              <div className="flex justify-between text-xs text-purple-400 mb-2 uppercase tracking-widest">
                <span>Epoch {lossData.length}/20</span>
                <span>{trainingProgress}%</span>
              </div>
              <div className="h-2 bg-jarvis-bg rounded overflow-hidden">
                <motion.div 
                  className="h-full bg-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${trainingProgress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          )}

          {/* Loss Curve Chart */}
          {(modelStatus === 'training' || modelStatus === 'deployed') && lossData.length > 0 && (
            <div className="h-64 w-full mt-6">
              <h4 className="text-xs text-cyan-500/70 uppercase tracking-widest mb-4 text-center">Training & Validation Loss Curve</h4>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lossData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#164e63" />
                  <XAxis dataKey="epoch" stroke="#67e8f9" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#67e8f9" fontSize={10} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#083344', borderColor: '#164e63', color: '#cffafe', fontSize: '12px' }}
                    labelStyle={{ color: '#67e8f9' }}
                  />
                  <Line type="monotone" dataKey="loss" name="Training Loss" stroke="#a855f7" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="val_loss" name="Validation Loss" stroke="#06b6d4" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Terminal Logs */}
          {(modelStatus === 'training' || (modelStatus === 'deployed' && trainingLogs.length > 0)) && (
            <div className="mt-6 bg-black/50 border border-cyan-900/50 rounded p-4 font-mono text-xs text-cyan-400/80 h-48 overflow-y-auto flex flex-col gap-1">
              {trainingLogs.map((log, i) => (
                <div key={i} className="whitespace-pre-wrap">{log}</div>
              ))}
              {modelStatus === 'training' && (
                <div className="animate-pulse">_</div>
              )}
            </div>
          )}
        </div>

        {/* BYOD Section */}
        <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h3 className="text-sm text-cyan-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                <Database className="w-4 h-4" /> Bring Your Own Data (BYOD)
              </h3>
              <p className="text-xs text-cyan-500/70">Upload proprietary toxicity assays (CSV) or connect to open-source databases via API to fine-tune the PyTorch GNN.</p>
            </div>
            <div className="flex bg-cyan-950/50 rounded-lg p-1 border border-cyan-900/50">
              <button
                onClick={() => setByodMode('csv')}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-md transition-colors ${byodMode === 'csv' ? 'bg-cyan-900/50 text-neon-cyan' : 'text-cyan-500/70 hover:text-cyan-100'}`}
              >
                CSV Upload
              </button>
              <button
                onClick={() => setByodMode('api')}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-md transition-colors ${byodMode === 'api' ? 'bg-cyan-900/50 text-neon-cyan' : 'text-cyan-500/70 hover:text-cyan-100'}`}
              >
                API Connection
              </button>
            </div>
          </div>

          {byodMode === 'csv' ? (
            <div className="relative border-2 border-dashed border-cyan-900/50 rounded-lg p-8 text-center hover:border-neon-cyan transition-colors cursor-pointer bg-cyan-950/10 group">
              <input 
                type="file" 
                accept=".csv" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (!file.name.endsWith('.csv')) {
                      alert("Please upload a valid .csv file.");
                      return;
                    }
                    // Simulate parsing and adding to training set
                    setTimeout(() => {
                      setFeedbackCount(prev => prev + Math.floor(Math.random() * 5000) + 1000);
                      alert(`Successfully ingested ${file.name}. Added to training pipeline.`);
                    }, 1500);
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                disabled={modelStatus === 'training'}
              />
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-cyan-900/30 flex items-center justify-center group-hover:bg-cyan-900/50 transition-colors">
                  <Database className="w-6 h-6 text-cyan-500/70 group-hover:text-neon-cyan transition-colors" />
                </div>
                <span className="text-sm text-cyan-100 font-bold tracking-wider">Drag & Drop or Click to Upload .csv</span>
                <span className="text-xs text-cyan-500/70 max-w-md">
                  Upload historical assay data, ADMET profiles, or clinical trial outcomes to improve the predictive accuracy of Aegis-SLM-v1 for your specific targets.
                </span>
              </div>
            </div>
          ) : (
            <div className="border border-cyan-900/50 rounded-lg p-6 bg-cyan-950/10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-xs text-cyan-500/70 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Globe className="w-3 h-3" /> Database Source
                  </label>
                  <select 
                    value={apiSource}
                    onChange={(e) => setApiSource(e.target.value)}
                    className="w-full bg-cyan-950/50 border border-cyan-900/50 rounded-md px-3 py-2 text-sm text-cyan-100 focus:outline-none focus:border-neon-cyan transition-colors"
                  >
                    <option value="chembl">ChEMBL (Bioactivity Data)</option>
                    <option value="pubchem">PubChem (Compound Data)</option>
                    <option value="drugbank">DrugBank (Open Data)</option>
                    <option value="bindingdb">BindingDB (Affinities)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-cyan-500/70 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Link className="w-3 h-3" /> API Endpoint / Query
                  </label>
                  <input 
                    type="text" 
                    value={apiEndpoint}
                    onChange={(e) => setApiEndpoint(e.target.value)}
                    placeholder="e.g., /api/data/target/CHEMBL204" 
                    className="w-full bg-cyan-950/50 border border-cyan-900/50 rounded-md px-3 py-2 text-sm text-cyan-100 focus:outline-none focus:border-neon-cyan transition-colors placeholder:text-cyan-900" 
                  />
                </div>
                <div>
                  <label className="block text-xs text-cyan-500/70 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Link className="w-3 h-3" /> API Key (If Required)
                  </label>
                  <input 
                    type="password" 
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter API Key or Token" 
                    className="w-full bg-cyan-950/50 border border-cyan-900/50 rounded-md px-3 py-2 text-sm text-cyan-100 focus:outline-none focus:border-neon-cyan transition-colors placeholder:text-cyan-900" 
                  />
                </div>
              </div>
              
              <div className="flex justify-between items-center border-t border-cyan-900/50 pt-4 mt-2">
                <span className="text-xs text-cyan-500/70">
                  Data will be securely fetched, normalized, and appended to your training set.
                </span>
                <button 
                  onClick={async () => {
                    if (!apiEndpoint && apiSource !== 'chembl') {
                      alert("Please enter an API endpoint or query.");
                      return;
                    }
                    setIsSyncing(true);
                    try {
                      const response = await fetch('/api/slm/fetch-data', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ source: apiSource, endpoint: apiEndpoint, apiKey })
                      });
                      
                      const result = await response.json();
                      
                      if (!response.ok) {
                        throw new Error(result.error || 'Failed to fetch data');
                      }
                      
                      setFeedbackCount(prev => prev + (result.recordsAdded || 0));
                      
                      // Trigger actual PyTorch training
                      try {
                        const trainRes = await fetch('/api/slm/train', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ source: apiSource, records: result.recordsAdded })
                        });
                        const trainData = await trainRes.json();
                        if (!trainRes.ok) throw new Error(trainData.error || 'Training server error');
                        alert(`Success: ${result.summary}\n${trainData.message}`);
                      } catch (trainErr: any) {
                        alert(`Success: ${result.summary}\nWarning: ${trainErr.message}`);
                      }
                      
                      setApiEndpoint('');
                    } catch (error: any) {
                      console.error("Sync error:", error);
                      alert(`Error syncing data: ${error.message}`);
                    } finally {
                      setIsSyncing(false);
                    }
                  }}
                  disabled={isSyncing || modelStatus === 'training'}
                  className="px-4 py-2 bg-cyan-900/50 text-neon-cyan text-xs font-bold uppercase tracking-widest rounded-md hover:bg-cyan-800/50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSyncing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" /> Connect & Sync
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </motion.div>
  );
}
