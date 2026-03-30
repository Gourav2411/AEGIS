import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Step } from '../App';
import { TrialResult, FormulationResult } from '../services/geminiService';
import { Activity, Beaker, ShieldAlert, Network, Dna, Target, Search, FlaskConical, CheckCircle2 } from 'lucide-react';
// @ts-ignore
import * as $3Dmol from '3dmol';

interface VisualizerProps {
  step: Step;
  loading: boolean;
  trialResult?: TrialResult | null;
  formulationResult?: FormulationResult | null;
  pdbFile?: File | null;
  receptors?: string;
}

export default function Visualizer({ step, loading, trialResult, formulationResult, pdbFile, receptors }: VisualizerProps) {
  const [simulationPhase, setSimulationPhase] = useState(0);
  const viewerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if ((step === 'trial-input' || step === 'input') && loading) {
      setSimulationPhase(0);
      const interval = setInterval(() => {
        setSimulationPhase(prev => (prev < 4 ? prev + 1 : prev));
      }, 2500); // Change phase every 2.5 seconds for smoother reading
      return () => clearInterval(interval);
    } else {
      setSimulationPhase(0);
    }
  }, [step, loading]);

  useEffect(() => {
    let animationFrameId: number;
    let viewer: any = null;
    let isMounted = true;

    const initViewer = async () => {
      if (!viewerRef.current) return;
      
      if (step === 'formulation' || step === 'physics' || step === 'trial-input' || step === 'trial') {
        viewerRef.current.innerHTML = ''; // Clear previous
        viewer = $3Dmol.createViewer(viewerRef.current, { backgroundColor: 'transparent' });

        const renderViewer = () => {
          viewer.zoomTo();
          viewer.render();
          
          // Add a subtle rotation animation
          const animate = () => {
            if (!isMounted) return;
            viewer.rotate(0.5, 'y');
            viewer.render();
            animationFrameId = requestAnimationFrame(animate);
          };
          animate();
        };

        let proteinCenter = {x: 0, y: 0, z: 0};

        // 1. Load Protein
        if (pdbFile) {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (!isMounted) return;
            const pdbData = e.target?.result as string;
            viewer.addModel(pdbData, 'pdb');
            viewer.setStyle({model: 0}, { cartoon: { color: 'spectrum' } });
            
            // Calculate center
            const atoms = viewer.getModel(0).selectedAtoms({});
            if (atoms.length > 0) {
               let sumX = 0, sumY = 0, sumZ = 0;
               atoms.forEach((a: any) => { sumX += a.x; sumY += a.y; sumZ += a.z; });
               proteinCenter = { x: sumX/atoms.length, y: sumY/atoms.length, z: sumZ/atoms.length };
            }
            loadLigand();
          };
          reader.readAsText(pdbFile);
        } else if (receptors) {
           // Try to load from PDB API if no file but we have a receptor name
           const pdbMap: Record<string, string> = {
            'EGFR': '1M17', 'HER2': '3RCD', 'KRAS': '4OBE', 'BRAF': '4RZV',
            'ALK': '3L9H', 'PD-1': '4ZQK', 'CDK4': '2W96'
          };
          let pdbId = '1M17'; // default
          const pdbMatch = receptors.match(/^([a-zA-Z0-9]{4})\s*-/);
          if (pdbMatch) {
            pdbId = pdbMatch[1].toUpperCase();
          } else {
            for (const [key, val] of Object.entries(pdbMap)) {
              if (receptors.toUpperCase().includes(key)) {
                pdbId = val;
                break;
              }
            }
          }
          try {
            const pdbResponse = await fetch(`https://files.rcsb.org/download/${pdbId}.pdb`);
            if (pdbResponse.ok && isMounted) {
              const pdbData = await pdbResponse.text();
              viewer.addModel(pdbData, 'pdb');
              viewer.setStyle({model: 0}, { cartoon: { color: 'spectrum' } });
              
              const atoms = viewer.getModel(0).selectedAtoms({});
              if (atoms.length > 0) {
                 let sumX = 0, sumY = 0, sumZ = 0;
                 atoms.forEach((a: any) => { sumX += a.x; sumY += a.y; sumZ += a.z; });
                 proteinCenter = { x: sumX/atoms.length, y: sumY/atoms.length, z: sumZ/atoms.length };
              }
            }
          } catch (e) {
            console.warn("Failed to load protein PDB:", e);
          }
          loadLigand();
        } else {
          loadLigand();
        }

        async function loadLigand() {
          if (!isMounted) return;
          if (formulationResult?.smilesString) {
            try {
              let sdfData = '';
              const smiles = formulationResult.smilesString;
              try {
                // Try PubChem 3D via POST
                const pubchem3dRes = await fetch('https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/SDF?record_type=3d', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                  },
                  body: new URLSearchParams({ smiles }).toString()
                });
                
                if (pubchem3dRes.ok) {
                  sdfData = await pubchem3dRes.text();
                } else {
                  throw new Error('PubChem 3D failed');
                }
              } catch (e1) {
                try {
                  // Try PubChem 2D via POST
                  const pubchem2dRes = await fetch('https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/SDF', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({ smiles }).toString()
                  });
                  
                  if (pubchem2dRes.ok) {
                    sdfData = await pubchem2dRes.text();
                  } else {
                    throw new Error('PubChem 2D failed');
                  }
                } catch (e2) {
                  try {
                    // Try CACTUS 3D
                    const cactus3dRes = await fetch(`https://cactus.nci.nih.gov/chemical/structure/${encodeURIComponent(smiles)}/file?format=sdf&get3d=true`);
                    if (cactus3dRes.ok) {
                      sdfData = await cactus3dRes.text();
                    } else {
                      throw new Error('CACTUS 3D failed');
                    }
                  } catch (e3) {
                    try {
                      // Try CACTUS 2D
                      const cactus2dRes = await fetch(`https://cactus.nci.nih.gov/chemical/structure/${encodeURIComponent(smiles)}/file?format=sdf`);
                      if (cactus2dRes.ok) {
                        sdfData = await cactus2dRes.text();
                      } else {
                        throw new Error('CACTUS 2D failed');
                      }
                    } catch (e4) {
                      const fallbackName = formulationResult?.closestMedicines?.[0]?.name;
                      if (fallbackName) {
                        try {
                          const fallbackRes = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(fallbackName)}/SDF?record_type=3d`);
                          if (fallbackRes.ok) {
                            sdfData = await fallbackRes.text();
                            console.warn(`Used fallback 3D structure for ${fallbackName}`);
                          } else {
                            const fallback2dRes = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(fallbackName)}/SDF`);
                            if (fallback2dRes.ok) {
                              sdfData = await fallback2dRes.text();
                              console.warn(`Used fallback 2D structure for ${fallbackName}`);
                            } else {
                              throw new Error('Fallback failed');
                            }
                          }
                        } catch (e5) {
                          sdfData = `
  -OEChem-03232606412D

  6  6  0     0  0  0  0  0  0999 V2000
    2.8660    0.2500    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    2.0000    0.7500    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.1340    0.2500    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.1340   -0.7500    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    2.0000   -1.2500    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    2.8660   -0.7500    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  2  0  0  0  0
  2  3  1  0  0  0  0
  3  4  2  0  0  0  0
  4  5  1  0  0  0  0
  5  6  2  0  0  0  0
  6  1  1  0  0  0  0
M  END
`;
                          console.warn("Used hardcoded fallback structure");
                        }
                      } else {
                        sdfData = `
  -OEChem-03232606412D

  6  6  0     0  0  0  0  0  0999 V2000
    2.8660    0.2500    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    2.0000    0.7500    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.1340    0.2500    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.1340   -0.7500    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    2.0000   -1.2500    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    2.8660   -0.7500    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  2  0  0  0  0
  2  3  1  0  0  0  0
  3  4  2  0  0  0  0
  4  5  1  0  0  0  0
  5  6  2  0  0  0  0
  6  1  1  0  0  0  0
M  END
`;
                        console.warn("Used hardcoded fallback structure");
                      }
                    }
                  }
                }
              }

              if (isMounted && sdfData) {
                const ligandModel = viewer.addModel(sdfData, 'sdf');
                const ligandModelId = viewer.getModels().length - 1;
                
                viewer.setStyle({model: ligandModelId}, { stick: { radius: 0.2, colorscheme: 'cyanCarbon' }, sphere: { radius: 0.5, colorscheme: 'cyanCarbon' } });
                
                // Docking simulation: translate ligand to protein center
                if (proteinCenter.x !== 0) {
                  // We can't easily translate the ligand without a real docking backend,
                  // so we will just highlight the interacting residues on the protein.
                }

                // Highlight interacting residues
                const interactingResidues = formulationResult.interactingResidues || ['TYR', 'SER', 'ASP']; // Mock if not provided
                if (interactingResidues && interactingResidues.length > 0) {
                  if (receptors) {
                    // Highlight on the protein
                    interactingResidues.forEach(res => {
                      // res is like "Arg234"
                      const resName = res.substring(0, 3).toUpperCase();
                      const resi = parseInt(res.substring(3));
                      if (!isNaN(resi)) {
                         viewer.setStyle({model: 0, resi: resi}, { cartoon: { color: 'red' }, stick: { radius: 0.2, colorscheme: 'cyanCarbon' } });
                         // Add label
                         const atoms = viewer.getModel(0).selectedAtoms({resi: resi});
                         if (atoms.length > 0) {
                            viewer.addLabel(res, {
                              position: { x: atoms[0].x, y: atoms[0].y, z: atoms[0].z },
                              backgroundColor: 'rgba(239, 68, 68, 0.8)',
                              fontColor: 'white',
                              backgroundOpacity: 0.8,
                              fontSize: 12,
                              showBackground: true,
                              inFront: true
                            });
                         }
                      }
                    });
                  } else {
                    // Fallback: highlight random atoms on the ligand
                    const atoms = viewer.getModel(ligandModelId).selectedAtoms({});
                    if (atoms.length > 0) {
                      interactingResidues.forEach((res, index) => {
                        const atomIndex = Math.floor(Math.abs(Math.sin(index + 1)) * atoms.length);
                        const atom = atoms[atomIndex];
                        if (atom) {
                          viewer.addLabel(res, {
                            position: { x: atom.x, y: atom.y, z: atom.z },
                            backgroundColor: 'rgba(239, 68, 68, 0.8)',
                            fontColor: 'white',
                            backgroundOpacity: 0.8,
                            fontSize: 12,
                            showBackground: true,
                            inFront: true
                          });
                          viewer.setStyle({model: ligandModelId, serial: atom.serial}, { stick: { radius: 0.3, color: 'red' }, sphere: { radius: 0.6, color: 'red' } });
                        }
                      });
                    }
                  }
                }
              }
            } catch (e) {
              console.warn("Failed to load ligand 3D structure:", e);
              // Fallback to 2D SMILES if 3D fails
              try {
                viewer.addModel(formulationResult.smilesString, 'smi');
                viewer.setStyle({model: -1}, { stick: { colorscheme: 'cyanCarbon' } });
              } catch (fallbackErr) {
                console.warn("Fallback to SMILES failed:", fallbackErr);
              }
            }
          }
          renderViewer();
        }
      }
    };

    initViewer();

    return () => {
      isMounted = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (viewer) {
        viewer.removeAllModels();
      }
    };
  }, [pdbFile, formulationResult, step]);
  
  // Base animation for the outer rings
  const ringAnimation = {
    rotate: [0, 360],
    transition: {
      duration: loading ? 4 : 20,
      repeat: Infinity,
      ease: "linear" as const
    }
  };

  const reverseRingAnimation = {
    rotate: [360, 0],
    transition: {
      duration: loading ? 5 : 25,
      repeat: Infinity,
      ease: "linear" as const
    }
  };

  const phaseVariants: any = {
    initial: { opacity: 0, y: 15, scale: 0.9, filter: 'blur(4px)' },
    animate: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', transition: { duration: 0.8, ease: "easeOut" } },
    exit: { opacity: 0, y: -15, scale: 0.9, filter: 'blur(4px)', transition: { duration: 0.6, ease: "easeIn" } }
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
        
        {(pdbFile || formulationResult?.smilesString) ? (
          <div ref={viewerRef} className="w-full h-full relative z-10" style={{ position: 'relative' }}></div>
        ) : (
          <>
            {step === 'input' && !loading && (
              <motion.div 
                className="w-16 h-16 rounded-full bg-cyan-900/50 border border-neon-cyan flex items-center justify-center"
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="w-8 h-8 rounded-full bg-neon-cyan blur-sm"></div>
              </motion.div>
            )}

            {step === 'input' && loading && (
              <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
                <AnimatePresence mode="wait">
                  {simulationPhase === 0 && (
                    <motion.div key="phase0" variants={phaseVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col items-center text-cyan-400 absolute">
                      <Target className="w-12 h-12 mb-2 animate-pulse" />
                      <span className="text-[10px] uppercase tracking-widest text-center">Target ID</span>
                    </motion.div>
                  )}
                  {simulationPhase === 1 && (
                    <motion.div key="phase1" variants={phaseVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col items-center text-purple-400 absolute">
                      <Search className="w-12 h-12 mb-2 animate-ping" style={{ animationDuration: '2s' }} />
                      <span className="text-[10px] uppercase tracking-widest text-center">Screening</span>
                    </motion.div>
                  )}
                  {simulationPhase === 2 && (
                    <motion.div key="phase2" variants={phaseVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col items-center text-yellow-400 absolute">
                      <Dna className="w-12 h-12 mb-2 animate-spin-slow" />
                      <span className="text-[10px] uppercase tracking-widest text-center">Optimization</span>
                    </motion.div>
                  )}
                  {simulationPhase === 3 && (
                    <motion.div key="phase3" variants={phaseVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col items-center text-blue-400 absolute">
                      <FlaskConical className="w-12 h-12 mb-2 animate-bounce" style={{ animationDuration: '2s' }} />
                      <span className="text-[10px] uppercase tracking-widest text-center">Formulation</span>
                    </motion.div>
                  )}
                  {simulationPhase === 4 && (
                    <motion.div key="phase4" variants={phaseVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col items-center text-green-400 absolute">
                      <CheckCircle2 className="w-12 h-12 mb-2" />
                      <span className="text-[10px] uppercase tracking-widest text-center">Synthesis Complete</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </>
        )}

        {step === 'formulation' && !(pdbFile || formulationResult?.smilesString) && (
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

        {step === 'trial-input' && !loading && !(pdbFile || formulationResult?.smilesString) && (
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

        {step === 'trial-input' && loading && !(pdbFile || formulationResult?.smilesString) && (
          <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
            <AnimatePresence mode="wait">
              {simulationPhase === 0 && (
                <motion.div key="phase0" variants={phaseVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col items-center text-cyan-400 absolute">
                  <Network className="w-12 h-12 mb-2 animate-pulse" />
                  <span className="text-[10px] uppercase tracking-widest text-center">In-Silico Docking</span>
                </motion.div>
              )}
              {simulationPhase === 1 && (
                <motion.div key="phase1" variants={phaseVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col items-center text-green-400 absolute">
                  <Beaker className="w-12 h-12 mb-2 animate-bounce" style={{ animationDuration: '2s' }} />
                  <span className="text-[10px] uppercase tracking-widest text-center">In-Vitro Cell Cultures</span>
                </motion.div>
              )}
              {simulationPhase === 2 && (
                <motion.div key="phase2" variants={phaseVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col items-center text-yellow-400 absolute">
                  <ShieldAlert className="w-12 h-12 mb-2" style={{ animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
                  <span className="text-[10px] uppercase tracking-widest text-center">Toxicity Screening</span>
                </motion.div>
              )}
              {simulationPhase === 3 && (
                <motion.div key="phase3" variants={phaseVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col items-center text-purple-400 absolute">
                  <Activity className="w-12 h-12 mb-2 animate-pulse" />
                  <span className="text-[10px] uppercase tracking-widest text-center">Pharmacokinetics</span>
                </motion.div>
              )}
              {simulationPhase === 4 && (
                <motion.div key="phase4" variants={phaseVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col items-center text-neon-cyan absolute">
                  <Dna className="w-12 h-12 mb-2 animate-spin" style={{ animationDuration: '4s' }} />
                  <span className="text-[10px] uppercase tracking-widest text-center">Data Aggregation</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {step === 'trial' && !(pdbFile || formulationResult?.smilesString) && (
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

        {step === 'packaging' && !(pdbFile || formulationResult?.smilesString) && (
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
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-neon-cyan rounded-full"
              initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
              animate={{ 
                x: (Math.random() - 0.5) * 250, 
                y: (Math.random() - 0.5) * 250,
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0]
              }}
              transition={{ duration: 1.5 + Math.random(), repeat: Infinity, delay: Math.random() * 2, ease: "easeInOut" }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
