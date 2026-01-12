import React, { useMemo, useState, useEffect } from 'react';

interface ProgressRingProps {
  radius: number;
  stroke: number;
  lastCheckIn: number | null;
  thresholdHours: number;
  children?: React.ReactNode;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({ 
  radius, 
  stroke, 
  lastCheckIn,
  thresholdHours,
  children 
}) => {
  const [timeLeftPercent, setTimeLeftPercent] = useState(0);
  const [timeString, setTimeString] = useState("00:00:00");

  useEffect(() => {
    if (!lastCheckIn) {
      setTimeLeftPercent(0);
      setTimeString("00:00:00");
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const thresholdMs = thresholdHours * 60 * 60 * 1000;
      const elapsed = now - lastCheckIn;
      const remaining = Math.max(0, thresholdMs - elapsed);
      
      // Calculate Percentage (0% means time is up)
      const percent = (remaining / thresholdMs) * 100;
      setTimeLeftPercent(percent);

      // Format HH:MM:SS
      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
      
      setTimeString(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lastCheckIn, thresholdHours]);

  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  
  const strokeDashoffset = useMemo(() => {
     return circumference - (timeLeftPercent / 100) * circumference;
  }, [timeLeftPercent, circumference]);

  // Smooth Color Transition Logic
  const strokeColor = useMemo(() => {
    if (timeLeftPercent > 50) return '#00ff41'; // Green
    if (timeLeftPercent > 20) return '#facc15'; // Yellow
    return '#ff003c'; // Red
  }, [timeLeftPercent]);

  return (
    <div className="relative flex items-center justify-center group">
      {/* Outer Glow Container - Changes color based on state */}
      <div 
        className="absolute inset-0 rounded-full blur-xl opacity-20 transition-colors duration-1000" 
        style={{ backgroundColor: strokeColor }}
      ></div>

      <svg
        height={radius * 2}
        width={radius * 2}
        className="rotate-[-90deg] transition-all duration-500 relative z-10"
      >
        {/* Background Track */}
        <circle
          stroke="#1a1a1a"
          strokeWidth={stroke}
          fill="transparent"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        {/* Active Progress */}
        <circle
          stroke={strokeColor}
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset }}
          strokeLinecap="square"
          fill="transparent"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="transition-all duration-1000 ease-linear"
        />
      </svg>
      
      {/* Interactive Child (Button) */}
      <div className="absolute inset-0 flex items-center justify-center z-20">
        {children}
      </div>

      {/* Timer Overlay */}
      <div className="absolute top-[68%] left-1/2 transform -translate-x-1/2 pointer-events-none z-30 flex flex-col items-center">
         <span className="text-[10px] uppercase tracking-widest text-white/50 mb-0.5">下一次脉冲确认倒计时...</span>
         <span 
           className="font-tech text-2xl font-bold tracking-wider drop-shadow-md transition-colors duration-500"
           style={{ color: strokeColor }}
         >
           {timeString}
         </span>
      </div>
    </div>
  );
};