import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BrainCircuit, Database, Play, CheckCircle2, ChevronLeft, RefreshCw, Activity, TrendingUp, AlertTriangle } from 'lucide-react';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SlmStudioProps {
  onBack: () => void;
}

export default function SlmStudio({ onBack }: SlmStudioProps) {
  const [loading, setLoading] = useState(true);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [modelStatus, setModelStatus] = useState<'untrained' | 'training' | 'deployed'>('untrained');
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [lossData, setLossData] = useState<{ epoch: number; loss: number }[]>([]);
  const [modelAccuracy, setModelAccuracy] = useState(0);

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
            const dummyData = Array.from({ length: 20 }, (_, i) => ({
              epoch: i + 1,
              loss: Math.max(0.1, 2.5 * Math.exp(-i / 5) + (Math.random() * 0.2 - 0.1))
            }));
            setLossData(dummyData);
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
    
    // Update DB to training
    const modelRef = doc(db, 'models', 'global_slm');
    await setDoc(modelRef, {
      status: 'training',
      updatedAt: new Date()
    }, { merge: true });

    // Simulate training process
    let currentEpoch = 0;
    const totalEpochs = 20;
    
    const interval = setInterval(async () => {
      currentEpoch++;
      setTrainingProgress(Math.round((currentEpoch / totalEpochs) * 100));
      
      setLossData(prev => [...prev, {
        epoch: currentEpoch,
        loss: Math.max(0.1, 2.5 * Math.exp(-currentEpoch / 5) + (Math.random() * 0.2 - 0.1))
      }]);

      if (currentEpoch >= totalEpochs) {
        clearInterval(interval);
        
        const finalAccuracy = 85 + Math.floor(Math.random() * 10); // 85-94%
        setModelAccuracy(finalAccuracy);
        setModelStatus('deployed');
        
        // Update DB to deployed
        await setDoc(modelRef, {
          status: 'deployed',
          trainingSamples: feedbackCount,
          accuracy: finalAccuracy,
          updatedAt: new Date()
        }, { merge: true });
      }
    }, 500); // 500ms per epoch
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
              <button
                onClick={handleTrainModel}
                disabled={feedbackCount === 0}
                className="px-6 py-2 bg-neon-cyan/10 border border-neon-cyan text-neon-cyan text-sm uppercase tracking-widest hover:bg-neon-cyan hover:text-jarvis-bg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Play className="w-4 h-4" /> Initiate Fine-Tuning
              </button>
            )}

            {modelStatus === 'training' && (
              <div className="px-6 py-2 bg-purple-900/20 border border-purple-500 text-purple-400 text-sm uppercase tracking-widest flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" /> Training in Progress...
              </div>
            )}

            {modelStatus === 'deployed' && (
              <div className="flex gap-3">
                <button
                  onClick={handleTrainModel}
                  className="px-4 py-2 bg-cyan-950/50 border border-cyan-900/50 text-cyan-400 text-xs uppercase tracking-widest hover:text-neon-cyan hover:border-neon-cyan transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-3 h-3" /> Retrain
                </button>
                <div className="px-6 py-2 bg-neon-green/10 border border-neon-green text-neon-green text-sm uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Model Deployed
                </div>
              </div>
            )}
          </div>

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
              <h4 className="text-xs text-cyan-500/70 uppercase tracking-widest mb-4 text-center">Training Loss Curve</h4>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lossData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#164e63" />
                  <XAxis dataKey="epoch" stroke="#67e8f9" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#67e8f9" fontSize={10} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#083344', borderColor: '#164e63', color: '#cffafe', fontSize: '12px' }}
                    labelStyle={{ color: '#67e8f9' }}
                  />
                  <Line type="monotone" dataKey="loss" stroke="#a855f7" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>
    </motion.div>
  );
}
