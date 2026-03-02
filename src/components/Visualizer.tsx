import React from 'react';
import { motion } from 'motion/react';
import { Step } from '../App';
import { TrialResult } from '../services/geminiService';

interface VisualizerProps {
  step: Step;
  loading: boolean;
  trialResult?: TrialResult | null;
}

export default function Visualizer({ step, loading, trialResult }: VisualizerProps) {
  
  // Base animation for the outer rings
  const ringAnimation = {
    rotate: [0, 360],
    transition: {
      duration: loading ? 2 : 20,
      repeat: Infinity,
      ease: "linear"
    }
  };

  const reverseRingAnimation = {
    rotate: [360, 0],
    transition: {
      duration: loading ? 3 : 25,
      repeat: Infinity,
      ease: "linear"
    }
  };

  return (
    <div className="relative w-full aspect-square max-w-[300px] flex items-center justify-center">
      
      {/* Outer Glow */}
      <div className={`absolute inset-0 rounded-full blur-3xl opacity-20 transition-colors duration-1000 ${
        step === 'input' ? 'bg-cyan-500' :
        step === 'formulation' ? 'bg-purple-500' :
        (step === 'trial' || step === 'trial-input') ? 'bg-green-500' : 'bg-blue-500'
      }`}></div>

      {/* Ring 1 (Outer) */}
      <motion.div 
        className="absolute inset-0 rounded-full border border-cyan-900/50 border-t-neon-cyan/50 border-b-neon-cyan/50"
        animate={ringAnimation}
      />

      {/* Ring 2 (Middle) */}
      <motion.div 
        className="absolute inset-4 rounded-full border border-cyan-800/50 border-l-neon-cyan/80 border-r-neon-cyan/80"
        animate={reverseRingAnimation}
      />

      {/* Ring 3 (Inner - Dashed) */}
      <motion.div 
        className="absolute inset-8 rounded-full border border-dashed border-cyan-500/30"
        animate={ringAnimation}
        style={{ transitionDuration: '15s' }}
      />

      {/* Core Element based on Step */}
      <div className="absolute inset-12 rounded-full flex items-center justify-center bg-jarvis-bg/50 backdrop-blur-sm border border-cyan-900/50 overflow-hidden">
        
        {step === 'input' && (
          <motion.div 
            className="w-16 h-16 rounded-full bg-cyan-900/50 border border-neon-cyan flex items-center justify-center"
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-8 h-8 rounded-full bg-neon-cyan blur-sm"></div>
          </motion.div>
        )}

        {step === 'formulation' && (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Hexagon pattern representing molecules */}
            <motion.svg width="80" height="80" viewBox="0 0 100 100" className="text-neon-cyan">
              <motion.polygon 
                points="50 5, 90 25, 90 75, 50 95, 10 75, 10 25" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              />
              <motion.polygon 
                points="50 20, 75 35, 75 65, 50 80, 25 65, 25 35" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1"
                animate={{ rotate: -360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              />
              <circle cx="50" cy="50" r="5" fill="currentColor" />
            </motion.svg>
          </div>
        )}

        {step === 'trial-input' && (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* DNA / Sine wave representing trials */}
            <motion.svg width="80" height="80" viewBox="0 0 100 100" className="text-neon-green">
              <motion.path 
                d="M 10 50 Q 30 10 50 50 T 90 50" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="3"
                animate={{ d: ["M 10 50 Q 30 10 50 50 T 90 50", "M 10 50 Q 30 90 50 50 T 90 50", "M 10 50 Q 30 10 50 50 T 90 50"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.path 
                d="M 10 50 Q 30 90 50 50 T 90 50" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="3"
                opacity="0.5"
                animate={{ d: ["M 10 50 Q 30 90 50 50 T 90 50", "M 10 50 Q 30 10 50 50 T 90 50", "M 10 50 Q 30 90 50 50 T 90 50"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.svg>
          </div>
        )}

        {step === 'trial' && (
          <div className="relative w-full h-full flex items-center justify-center">
            {trialResult ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <svg width="100%" height="100%" viewBox="0 0 200 200" className="overflow-visible">
                  {/* Background tracks */}
                  <circle cx="100" cy="100" r="75" fill="none" stroke="currentColor" className="text-purple-900/30" strokeWidth="10" />
                  <circle cx="100" cy="100" r="55" fill="none" stroke="currentColor" className="text-cyan-900/30" strokeWidth="10" />
                  <circle cx="100" cy="100" r="35" fill="none" stroke="currentColor" className="text-green-900/30" strokeWidth="10" />

                  {/* Progress tracks */}
                  <motion.circle
                    cx="100" cy="100" r="75" fill="none" stroke="currentColor" className="text-purple-400" strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 75}
                    initial={{ strokeDashoffset: 2 * Math.PI * 75 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 75 * (1 - trialResult.overallViability / 100) }}
                    transition={{ duration: 1.5, delay: 0.4, ease: "easeOut" }}
                    transform="rotate(-90 100 100)"
                  />
                  <motion.circle
                    cx="100" cy="100" r="55" fill="none" stroke="currentColor" className="text-neon-cyan" strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 55}
                    initial={{ strokeDashoffset: 2 * Math.PI * 55 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 55 * (1 - trialResult.inVitroSuccess / 100) }}
                    transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
                    transform="rotate(-90 100 100)"
                  />
                  <motion.circle
                    cx="100" cy="100" r="35" fill="none" stroke="currentColor" className="text-neon-green" strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 35}
                    initial={{ strokeDashoffset: 2 * Math.PI * 35 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 35 * (1 - trialResult.inSilicoSuccess / 100) }}
                    transition={{ duration: 1.5, delay: 0, ease: "easeOut" }}
                    transform="rotate(-90 100 100)"
                  />
                </svg>
                
                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <motion.span 
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1 }}
                    className="text-3xl font-bold text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.5)]"
                  >
                    {trialResult.overallViability}%
                  </motion.span>
                </div>
                
                {/* Labels */}
                <div className="absolute inset-0 pointer-events-none">
                   <div className="absolute top-[12.5%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px] text-purple-400 font-mono tracking-widest bg-black/60 backdrop-blur-md px-2 py-0.5 rounded border border-purple-500/30">VIABILITY</div>
                   <div className="absolute top-[22.5%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px] text-neon-cyan font-mono tracking-widest bg-black/60 backdrop-blur-md px-2 py-0.5 rounded border border-cyan-500/30">IN-VITRO</div>
                   <div className="absolute top-[32.5%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px] text-neon-green font-mono tracking-widest bg-black/60 backdrop-blur-md px-2 py-0.5 rounded border border-green-500/30">IN-SILICO</div>
                </div>
              </div>
            ) : (
              <motion.svg width="80" height="80" viewBox="0 0 100 100" className="text-neon-green">
                <motion.path 
                  d="M 10 50 Q 30 10 50 50 T 90 50" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="3"
                  animate={{ d: ["M 10 50 Q 30 10 50 50 T 90 50", "M 10 50 Q 30 90 50 50 T 90 50", "M 10 50 Q 30 10 50 50 T 90 50"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.path 
                  d="M 10 50 Q 30 90 50 50 T 90 50" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="3"
                  opacity="0.5"
                  animate={{ d: ["M 10 50 Q 30 90 50 50 T 90 50", "M 10 50 Q 30 10 50 50 T 90 50", "M 10 50 Q 30 90 50 50 T 90 50"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              </motion.svg>
            )}
          </div>
        )}

        {step === 'packaging' && (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Box / Package representation */}
            <motion.svg width="60" height="60" viewBox="0 0 100 100" className="text-blue-400">
              <motion.rect 
                x="20" y="20" width="60" height="60" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="3"
                animate={{ rotate: [0, 90, 180, 270, 360] }}
                transition={{ duration: 4, repeat: Infinity, ease: "anticipate" }}
              />
              <motion.rect 
                x="35" y="35" width="30" height="30" 
                fill="currentColor" 
                opacity="0.5"
                animate={{ scale: [1, 0.8, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.svg>
          </div>
        )}

      </div>

      {/* Data streams (simulated) */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-neon-cyan rounded-full"
              initial={{ x: 0, y: 0, opacity: 1 }}
              animate={{ 
                x: (Math.random() - 0.5) * 200, 
                y: (Math.random() - 0.5) * 200,
                opacity: 0
              }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
