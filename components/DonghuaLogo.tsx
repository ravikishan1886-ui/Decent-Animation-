import React from 'react';

export function DonghuaLogo({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Outer sacred seal circle */}
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_8px_rgba(201,42,42,0.8)]">
        <defs>
          <linearGradient id="daoGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="50%" stopColor="#d4af37" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
          <linearGradient id="flameRed" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#7f1d1d" />
          </linearGradient>
        </defs>

        {/* Traditional Dao octagon / bagua trim */}
        <polygon
          points="30,5 70,5 95,30 95,70 70,95 30,95 5,70 5,30"
          fill="none"
          stroke="url(#daoGold)"
          strokeWidth="3"
          strokeDasharray="4 2"
        />

        {/* Inner seal circle */}
        <circle cx="50" cy="50" r="38" fill="#13090b" stroke="url(#flameRed)" strokeWidth="2.5" />

        {/* Cultivation Sword / Flame symbol */}
        <path
          d="M50 16 L56 38 L54 74 L50 82 L46 74 L44 38 Z"
          fill="url(#daoGold)"
          className="drop-shadow-[0_0_6px_rgba(212,175,55,0.9)]"
        />
        <path d="M50 20 L52 70 L48 70 Z" fill="#ffffff" opacity="0.6" />
        {/* Crossguard wings */}
        <path
          d="M34 46 C42 42, 58 42, 66 46 C60 52, 40 52, 34 46 Z"
          fill="url(#flameRed)"
        />
      </svg>
    </div>
  );
}

export function ChineseCloudPattern() {
  return (
    <div className="absolute inset-0 pointer-events-none opacity-5 overflow-hidden">
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="chineseCloud" width="80" height="80" patternUnits="userSpaceOnUse">
            <path
              d="M 20 40 Q 20 20 40 20 Q 60 20 60 40 Q 75 40 75 55 Q 75 70 55 70 L 25 70 Q 5 70 5 55 Q 5 40 20 40 Z"
              fill="none"
              stroke="#d4af37"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#chineseCloud)" />
      </svg>
    </div>
  );
}
