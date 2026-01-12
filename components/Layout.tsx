import React from 'react';
import { GlobalStats } from './GlobalStats';

interface LayoutProps {
  children: React.ReactNode;
  isAlert?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, isAlert = false }) => {
  return (
    <div className={`min-h-screen flex flex-col relative overflow-hidden transition-colors duration-1000 ${isAlert ? 'shadow-[inset_0_0_100px_rgba(255,0,60,0.2)]' : ''}`}>
      {/* Visual Filters */}
      <div className={`scanlines ${isAlert ? 'bg-red-900/10' : ''}`}></div>
      <div className="scan-overlay"></div>
      
      {/* Top Status Bar */}
      <header className="relative z-30 w-full shrink-0">
         <GlobalStats />
      </header>

      {/* Content */}
      <main className="relative z-10 flex-grow flex flex-col p-4 md:p-8 max-w-4xl mx-auto w-full h-full">
        <div className={`mt-4 mb-8 border-b pb-4 flex justify-between items-end transition-colors duration-500 ${isAlert ? 'border-cyber-red/50' : 'border-cyber-green/30'}`}>
          <h1 className={`text-xl md:text-3xl font-bold tracking-tighter uppercase glitch-text font-tech ${isAlert ? 'text-cyber-red drop-shadow-[0_0_5px_rgba(255,0,60,0.8)]' : 'text-cyber-green'}`} title="Still-Alive">
            STILL-ALIVE_我还在 <span className={`text-xs align-top opacity-70 ml-2 animate-pulse ${isAlert ? 'text-cyber-red' : ''}`}>[{isAlert ? '危急' : '在线'}]</span>
          </h1>
          <div className={`text-[10px] md:text-xs text-right opacity-60 leading-tight font-mono ${isAlert ? 'text-cyber-red' : ''}`}>
             协议状态: {isAlert ? '严重失效' : '存活维持'}<br/>v2.0.4-BETA
          </div>
        </div>
        
        <div className="flex-grow flex flex-col relative">
          {children}
        </div>
      </main>
    </div>
  );
};