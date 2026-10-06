'use client';

import React from 'react';

interface AudioVisualizerProps {
  isActive: boolean;
  barCount?: number;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isActive, barCount = 12 }) => {
  return (
    <div className="flex items-center gap-1 h-5 px-2 py-1 bg-cyan-950/40 border border-cyan-500/30 rounded-full backdrop-blur-sm">
      {Array.from({ length: barCount }).map((_, i) => {
        const heights = ['h-2', 'h-4', 'h-3', 'h-5', 'h-2', 'h-4'];
        const heightClass = heights[i % heights.length];
        return (
          <div
            key={i}
            className={`w-0.5 rounded-full bg-gradient-to-t from-cyan-400 to-fuchsia-400 transition-all duration-150 ${
              isActive ? `${heightClass} animate-pulse` : 'h-1 opacity-30'
            }`}
            style={{
              animationDelay: `${i * 80}ms`,
              animationDuration: '600ms',
            }}
          />
        );
      })}
    </div>
  );
};
