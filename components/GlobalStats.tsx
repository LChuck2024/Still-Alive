import React, { useState, useEffect } from 'react';

export const GlobalStats: React.FC = () => {
  const [survivors, setSurvivors] = useState(128542);
  const [signalStrength, setSignalStrength] = useState(99.8);

  useEffect(() => {
    const interval = setInterval(() => {
      // Fluctuate survivors randomly
      if (Math.random() > 0.5) {
        const change = Math.floor(Math.random() * 5) * (Math.random() > 0.5 ? 1 : -1);
        setSurvivors(prev => prev + change);
      }
      // Fluctuate signal strength slightly
      if (Math.random() > 0.7) {
        setSignalStrength(prev => {
          const change = (Math.random() - 0.5) * 0.1;
          const newVal = parseFloat((prev + change).toFixed(1));
          return Math.min(100, Math.max(0, newVal));
        });
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-black/40 backdrop-blur-md border-b border-cyber-green/20 px-4 py-1.5 flex justify-between items-center text-[10px] md:text-xs font-mono tracking-widest uppercase text-cyber-green/80 shadow-[0_1px_10px_rgba(0,255,65,0.1)]">
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
           <div className="flex gap-0.5 items-end h-3">
             <div className="w-1 h-1 bg-cyber-green/40"></div>
             <div className="w-1 h-2 bg-cyber-green/60"></div>
             <div className="w-1 h-3 bg-cyber-green animate-pulse"></div>
           </div>
           <span>信号强度: {signalStrength}%</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="opacity-50 hidden md:inline">全网幸存者:</span>
        <span className="font-tech text-sm text-cyber-green drop-shadow-[0_0_2px_rgba(0,255,65,0.8)]">
          {survivors.toLocaleString()}
        </span>
      </div>

    </div>
  );
};