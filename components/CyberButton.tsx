import React, { useState, useEffect } from 'react';

interface CyberButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'vip' | 'round';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const CyberButton: React.FC<CyberButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '',
  onClick,
  ...props 
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isHeartbeat, setIsHeartbeat] = useState(false);

  // Auto reset shockwave animation state
  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => setIsAnimating(false), 600);
      return () => clearTimeout(timer);
    }
  }, [isAnimating]);

  // Auto reset heartbeat animation state
  useEffect(() => {
    if (isHeartbeat) {
      const timer = setTimeout(() => setIsHeartbeat(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isHeartbeat]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsAnimating(true);
    setIsHeartbeat(true);
    if (onClick) onClick(e);
  };

  const baseStyle = "font-bold border uppercase tracking-widest relative group overflow-visible select-none";
  
  // Added transform transitions: active:scale-95 and active:scale-90 for stronger feedback
  const variants = {
    primary: "border-cyber-green text-cyber-green bg-black/50 hover:bg-cyber-green hover:text-black shadow-[0_0_10px_rgba(0,255,65,0.2)] hover:shadow-neon active:scale-95 transition-all duration-150 ease-out",
    danger: "border-cyber-red text-cyber-red bg-black/50 hover:bg-cyber-red hover:text-black shadow-[0_0_10px_rgba(255,0,60,0.2)] hover:shadow-neon-red active:scale-95 transition-all duration-150 ease-out",
    vip: "border-cyber-yellow text-cyber-yellow bg-black/50 hover:bg-cyber-yellow hover:text-black shadow-[0_0_10px_rgba(250,204,21,0.2)] active:scale-95 transition-all duration-150 ease-out",
    round: "rounded-full border-2 border-cyber-green bg-black text-cyber-green hover:bg-cyber-green/10 hover:shadow-[0_0_30px_rgba(0,255,65,0.4)] animate-pulse-slow active:scale-90 active:bg-cyber-green/20 transition-transform duration-100"
  };

  const sizes = {
    sm: "px-4 py-1 text-xs",
    md: "px-6 py-2 text-sm",
    lg: "px-8 py-3 text-lg",
    xl: "w-64 h-64 text-3xl flex flex-col items-center justify-center",
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className} ${isHeartbeat ? 'animate-heartbeat' : ''}`}
      onClick={handleClick}
      {...props}
    >
      {/* Shockwave Effect Layer */}
      {isAnimating && (
        <span className="absolute inset-0 rounded-full border-2 border-cyber-green animate-shockwave pointer-events-none z-0"></span>
      )}
      
      {/* Button Content */}
      <span className="relative z-10">{children}</span>
      
      {/* Corner Accents for rectangular buttons */}
      {variant !== 'round' && size !== 'xl' && (
        <>
          <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-current opacity-50 transition-opacity group-hover:opacity-100"></span>
          <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-current opacity-50 transition-opacity group-hover:opacity-100"></span>
        </>
      )}
    </button>
  );
};