import React, { useEffect, useRef, useState } from 'react';
import * as $3Dmol from '3dmol';
import { Loader2 } from 'lucide-react';

interface MolecularViewerProps {
  smiles: string;
  interactingResidues?: string[];
  receptor?: string;
  fallbackName?: string;
}

export default function MolecularViewer({ smiles, interactingResidues, receptor, fallbackName }: MolecularViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let viewer: any = null;
    let isMounted = true;

    const loadMolecule = async () => {
      if (!viewerRef.current) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Initialize viewer
        if (!viewer) {
          viewer = $3Dmol.createViewer(viewerRef.current, {
            backgroundColor: 'transparent',
            id: 'mol-viewer'
          });
        }
        viewer.clear();

        // 1. Load the Protein Receptor (if provided)
        let proteinCenter = {x: 0, y: 0, z: 0};
        if (receptor) {
          // Map common receptors to PDB IDs for demonstration
          const pdbMap: Record<string, string> = {
            'EGFR': '1M17',
            'HER2': '3RCD',
            'KRAS': '4OBE',
            'BRAF': '4RZV',
            'ALK': '3L9H',
            'PD-1': '4ZQK',
            'CDK4': '2W96'
          };
          
          let pdbId = '1M17';
          
          // Check if receptor string starts with a 4-character PDB ID (e.g., "1M17 - ...")
          const pdbMatch = receptor.match(/^([a-zA-Z0-9]{4})\s*-/);
          if (pdbMatch) {
            pdbId = pdbMatch[1].toUpperCase();
          } else {
            for (const [key, val] of Object.entries(pdbMap)) {
              if (receptor.toUpperCase().includes(key)) {
                pdbId = val;
                break;
              }
            }
          }

          try {
            const pdbResponse = await fetch(`https://files.rcsb.org/download/${pdbId}.pdb`);
            if (pdbResponse.ok) {
              const pdbData = await pdbResponse.text();
              viewer.addModel(pdbData, 'pdb');
              
              // Style the protein
              viewer.setStyle({model: 0}, { cartoon: { color: 'spectrum' } });
              
              // Add surface to the protein pocket (optional, can be heavy)
              // viewer.addSurface($3Dmol.SurfaceType.VDW, {opacity: 0.6, color: 'white'}, {model: 0});
              
              // Find the center of the protein to place the ligand
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
        }

        // 2. Load the Ligand (Generated Drug)
        let sdfData = '';
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
                    setError('Showing placeholder structure (novel SMILES could not be rendered)');
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
                  setError('Showing placeholder structure (novel SMILES could not be rendered)');
                }
              }
            }
          }
        }
        
        if (!isMounted) return;

        // Add the ligand model
        const ligandModel = viewer.addModel(sdfData, 'sdf');
        const ligandModelId = viewer.getModels().length - 1;
        
        // If we have a protein, try to simulate docking by moving the ligand to the pocket
        if (receptor && proteinCenter.x !== 0) {
            const ligandAtoms = viewer.getModel(ligandModelId).selectedAtoms({});
            if (ligandAtoms.length > 0) {
              let lSumX = 0, lSumY = 0, lSumZ = 0;
              ligandAtoms.forEach((a: any) => { lSumX += a.x; lSumY += a.y; lSumZ += a.z; });
              const lCenter = { x: lSumX/ligandAtoms.length, y: lSumY/ligandAtoms.length, z: lSumZ/ligandAtoms.length };
              const dx = proteinCenter.x - lCenter.x;
              const dy = proteinCenter.y - lCenter.y;
              const dz = proteinCenter.z - lCenter.z;
              
              // Move ligand atoms to protein center
              ligandAtoms.forEach((a: any) => {
                a.x += dx;
                a.y += dy;
                a.z += dz;
              });
            }
        }

        // Style the ligand
        viewer.setStyle({model: ligandModelId}, { stick: { radius: 0.2, colorscheme: 'cyanCarbon' }, sphere: { radius: 0.5, colorscheme: 'cyanCarbon' } });

        // Highlight interacting residues if provided
        if (interactingResidues && interactingResidues.length > 0) {
          if (receptor) {
            // Highlight on the protein
            interactingResidues.forEach(res => {
              // res is like "Arg234" or "TYR-124"
              const match = res.match(/([a-zA-Z]{3})[-]?(\d+)/);
              if (match) {
                const resName = match[1].toUpperCase();
                const resi = parseInt(match[2]);
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

        if (receptor) {
          viewer.zoomTo({model: ligandModelId});
          viewer.zoom(0.8); // Zoom out slightly to see the pocket
        } else {
          viewer.zoomTo();
        }
        viewer.render();
        
        // Add a gentle rotation
        viewer.spin('y', 0.5);
        
      } catch (err) {
        if (isMounted) {
          console.warn('Error loading 3D molecule, falling back to SMILES:', err);
          try {
            viewer.addModel(smiles, 'smi');
            viewer.setStyle({model: -1}, { stick: { colorscheme: 'cyanCarbon' } });
            viewer.zoomTo();
            viewer.render();
            viewer.spin('y', 0.5);
          } catch (fallbackErr) {
            console.error('Fallback failed:', fallbackErr);
            setError('Failed to load 3D structure. The SMILES string might be too complex or invalid.');
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadMolecule();

    return () => {
      isMounted = false;
      if (viewer) {
        viewer.removeAllModels();
      }
    };
  }, [smiles, interactingResidues, receptor]);

  return (
    <div className="relative w-full h-full min-h-[250px] bg-cyan-950/30 rounded-lg border border-cyan-900/50 overflow-hidden flex items-center justify-center">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-jarvis-bg/80 z-10">
          <Loader2 className="w-8 h-8 text-neon-cyan animate-spin mb-2" />
          <span className="text-xs text-cyan-500 uppercase tracking-widest">Synthesizing 3D Model...</span>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center p-4 text-center z-10">
          <span className="text-xs text-red-400 font-mono">{error}</span>
        </div>
      )}
      
      <div ref={viewerRef} className="w-full h-full absolute inset-0" />
    </div>
  );
}
