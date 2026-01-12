import React, { useEffect, useState } from 'react';

interface AlertOverlayProps {
  email: string;
}

export const AlertOverlay: React.FC<AlertOverlayProps> = ({ email }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Fake progress bar for email sending
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        return prev + Math.random() * 10;
      });
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-1000">
      <div className="absolute inset-0 bg-red-500/10 mix-blend-overlay animate-pulse"></div>
      
      {/* Warning Icon */}
      <div className="text-cyber-red text-6xl md:text-8xl mb-6 animate-bounce">
        ⚠️
      </div>

      <h1 className="text-4xl md:text-6xl font-bold text-cyber-red tracking-widest uppercase glitch-text mb-2 text-center">
        协议失效
      </h1>
      
      <p className="text-cyber-red/80 font-mono text-sm md:text-lg mb-8 tracking-wider uppercase animate-pulse">
        未检测到脉冲信号
      </p>

      {/* Terminal Output */}
      <div className="w-full max-w-md bg-black border border-cyber-red p-4 font-mono text-xs md:text-sm text-cyber-red shadow-[0_0_20px_rgba(255,0,60,0.3)]">
        <div className="mb-2 border-b border-cyber-red/30 pb-2">紧急响应单元_V2</div>
        <div className="space-y-1">
          <p>{'>'} 正在检测生命体征... <span className="text-red-500 font-bold">无/阴性</span></p>
          <p>{'>'} 超出安全阈值。</p>
          <p>{'>'} 正在启动紧急联系协议...</p>
          <p>{'>'} 目标: {email}</p>
          <div className="mt-4">
            <div className="flex justify-between mb-1">
              <span>正在上传数据包</span>
              <span>{Math.floor(progress)}%</span>
            </div>
            <div className="w-full h-2 bg-cyber-red/20">
              <div 
                className="h-full bg-cyber-red transition-all duration-300" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
          {progress >= 100 && (
             <p className="mt-2 animate-pulse font-bold">{'>'} 发送成功。</p>
          )}
        </div>
      </div>
      
      <div className="absolute bottom-10 text-cyber-red/40 text-[10px] uppercase tracking-[0.5em]">
        请勿关闭您的终端
      </div>
    </div>
  );
};