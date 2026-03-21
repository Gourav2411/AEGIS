import React, { useEffect, useRef, useState } from 'react';
import * as $3Dmol from '3dmol';
import { Loader2 } from 'lucide-react';

interface MolecularViewerProps {
  smiles: string;
  interactingResidues?: string[];
  receptor?: string;
}

export default function MolecularViewer({ smiles, interactingResidues, receptor }: MolecularViewerProps) {
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
          
          // Try to find a matching PDB ID, default to a generic kinase (1M17) if not found
          let pdbId = '1M17';
          for (const [key, val] of Object.entries(pdbMap)) {
            if (receptor.toUpperCase().includes(key)) {
              pdbId = val;
              break;
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
        // Fetch 3D SDF from NIH CACTUS
        const response = await fetch(`https://cactus.nci.nih.gov/chemical/structure/${encodeURIComponent(smiles)}/file?format=sdf&get3d=true`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch 3D structure');
        }
        
        const sdfData = await response.text();
        
        if (!isMounted) return;

        // Add the ligand model
        const ligandModel = viewer.addModel(sdfData, 'sdf');
        const ligandModelId = viewer.getModels().length - 1;
        
        // Style the ligand
        viewer.setStyle({model: ligandModelId}, { stick: { radius: 0.2, colorscheme: 'cyanCarbon' }, sphere: { radius: 0.5, colorscheme: 'cyanCarbon' } });
        
        // If we have a protein, translate the ligand to the protein's center (simulated docking)
        if (receptor && proteinCenter.x !== 0) {
            const ligandAtoms = viewer.getModel(ligandModelId).selectedAtoms({});
            if (ligandAtoms.length > 0) {
                 let lSumX = 0, lSumY = 0, lSumZ = 0;
                 ligandAtoms.forEach((a: any) => { lSumX += a.x; lSumY += a.y; lSumZ += a.z; });
                 const lCenterX = lSumX/ligandAtoms.length;
                 const lCenterY = lSumY/ligandAtoms.length;
                 const lCenterZ = lSumZ/ligandAtoms.length;
                 
                 // Move ligand to protein center
                 const dx = proteinCenter.x - lCenterX;
                 const dy = proteinCenter.y - lCenterY;
                 const dz = proteinCenter.z - lCenterZ;
                 
                 // Apply translation to all atoms in the ligand model
                 // Note: 3Dmol.js doesn't have a simple translateModel function, so we modify atom coordinates
                 ligandAtoms.forEach((a: any) => {
                     a.x += dx;
                     a.y += dy;
                     a.z += dz;
                 });
                 // Update the model with new coordinates
                 viewer.getModel(ligandModelId).setCoordinates(ligandAtoms);
            }
        }

        // Highlight interacting residues if provided
        if (interactingResidues && interactingResidues.length > 0) {
          const atoms = viewer.getModel(ligandModelId).selectedAtoms({});
          if (atoms.length > 0) {
            interactingResidues.forEach((res, index) => {
              // Attach labels to random atoms for visualization purposes
              const atomIndex = Math.floor(Math.abs(Math.sin(index + 1)) * atoms.length);
              const atom = atoms[atomIndex];
              if (atom) {
                viewer.addLabel(res, {
                  position: { x: atom.x, y: atom.y, z: atom.z },
                  backgroundColor: 'rgba(239, 68, 68, 0.8)', // red-500
                  fontColor: 'white',
                  backgroundOpacity: 0.8,
                  fontSize: 12,
                  showBackground: true,
                  inFront: true
                });
                // Highlight the atom
                viewer.setStyle({model: ligandModelId, serial: atom.serial}, { stick: { radius: 0.3, color: 'red' }, sphere: { radius: 0.6, color: 'red' } });
              }
            });
          }
        }

        viewer.zoomTo();
        viewer.render();
        
        // Add a gentle rotation
        viewer.spin('y', 0.5);
        
      } catch (err) {
        if (isMounted) {
          console.error('Error loading 3D molecule:', err);
          setError('Failed to load 3D structure. The SMILES string might be too complex or invalid.');
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
