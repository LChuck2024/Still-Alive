import React, { useEffect, useRef } from 'react';

interface StatusMonitorProps {
  logs: string[];
}

export const StatusMonitor: React.FC<StatusMonitorProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when logs change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="mt-8 border border-cyber-green/20 bg-black/60 backdrop-blur-sm p-4 font-mono text-xs shadow-neon h-32 md:h-40 flex flex-col relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyber-green/50 to-transparent opacity-50"></div>
      
      <div className="flex justify-between items-center mb-2 border-b border-cyber-green/20 pb-2 shrink-0">
         <span className="uppercase font-bold tracking-wider">终端日志流</span>
         <div className="flex gap-2">
            <span className="w-2 h-2 rounded-full bg-cyber-green animate-pulse"></span>
            <span className="opacity-50">实时</span>
         </div>
      </div>
      
      <div className="flex-grow overflow-y-auto space-y-1.5 custom-scrollbar pr-2">
        {logs.length === 0 && <div className="opacity-30 italic">等待系统响应...</div>}
        {logs.map((log, i) => (
          <div key={i} className={`font-mono transition-opacity duration-300 ${log.includes("严重") || log.includes("故障") ? "text-cyber-red font-bold text-shadow-red" : "text-cyber-green/80"}`}>
            <span className="opacity-50 mr-2">{'>'}</span>{log}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};