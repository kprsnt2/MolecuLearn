import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    SmilesDrawer: any;
  }
}

interface MoleculeViewerProps {
  smiles: string;
  className?: string;
}

const MoleculeViewer: React.FC<MoleculeViewerProps> = ({ smiles, className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Ensure SmilesDrawer is loaded and we have a canvas
    if (!window.SmilesDrawer || !canvasRef.current || !smiles) return;

    // Wait for container to have dimensions
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = 160; // Fixed height for consistency

    // Set canvas dimensions explicitly to match resolution
    canvasRef.current.width = width;
    canvasRef.current.height = height;

    const options = {
      width: width,
      height: height,
      bondThickness: 1.0,
      color: '#34d399', // Emerald 400 matches the theme
      background: 'transparent',
      textColor: '#94a3b8', // Slate 400
      padding: 10,
    };

    try {
      const drawer = new window.SmilesDrawer.Drawer(options);
      
      window.SmilesDrawer.parse(smiles, (tree: any) => {
        if (canvasRef.current) {
            drawer.draw(tree, canvasRef.current, 'dark', false);
        }
      }, (err: any) => {
        console.warn('SmilesDrawer failed to parse:', smiles, err);
      });
    } catch (e) {
      console.error('Error initializing SmilesDrawer', e);
    }

  }, [smiles]);

  return (
    <div ref={containerRef} className={`w-full flex justify-center items-center bg-slate-900/50 rounded-lg border border-slate-700/30 overflow-hidden ${className}`}>
      <canvas ref={canvasRef} className="max-w-full" />
    </div>
  );
};

export default MoleculeViewer;