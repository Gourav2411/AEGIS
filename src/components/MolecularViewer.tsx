import React, { useEffect, useRef, useState } from 'react';
import * as $3Dmol from '3dmol';
import { Loader2 } from 'lucide-react';

interface MolecularViewerProps {
  smiles: string;
}

export default function MolecularViewer({ smiles }: MolecularViewerProps) {
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
        
        // Fetch 3D SDF from NIH CACTUS
        const response = await fetch(`https://cactus.nci.nih.gov/chemical/structure/${encodeURIComponent(smiles)}/file?format=sdf&get3d=true`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch 3D structure');
        }
        
        const sdfData = await response.text();
        
        if (!isMounted) return;

        // Initialize viewer
        if (!viewer) {
          viewer = $3Dmol.createViewer(viewerRef.current, {
            backgroundColor: 'transparent',
            id: 'mol-viewer'
          });
        }

        viewer.clear();
        viewer.addModel(sdfData, 'sdf');
        viewer.setStyle({}, { stick: { radius: 0.15, colorscheme: 'cyanCarbon' }, sphere: { radius: 0.4, colorscheme: 'cyanCarbon' } });
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
  }, [smiles]);

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
