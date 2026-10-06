'use client';

import React from 'react';
import { CameraPreset, BackgroundTheme } from '@/types/vrm';
import { HeartPulse, Camera, Maximize2, Video, RotateCcw, Monitor, Sparkles } from 'lucide-react';

interface HeaderProps {
  backendOnline: boolean;
  activeCamera: CameraPreset;
  onCameraChange: (preset: CameraPreset) => void;
  onResetCamera: () => void;
  obsMode: boolean;
  onToggleObsMode: () => void;
  theme: BackgroundTheme;
  onThemeChange: (theme: BackgroundTheme) => void;
  modelName: string;
}

export const Header: React.FC<HeaderProps> = ({
  backendOnline,
  activeCamera,
  onCameraChange,
  onResetCamera,
  obsMode,
  onToggleObsMode,
  theme,
  onThemeChange,
  modelName,
}) => {
  if (obsMode) {
    return (
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <button
          onClick={onToggleObsMode}
          className="px-3 py-1.5 bg-black/60 hover:bg-black/90 text-white rounded-lg backdrop-blur-md border border-white/20 text-xs flex items-center gap-1.5 shadow-lg transition-all"
        >
          <Monitor className="w-3.5 h-3.5 text-teal-400" />
          Keluar OBS Mode
        </button>
      </div>
    );
  }

  return (
    <header className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between pointer-events-auto">
      {/* Brand & Clinic Status */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-zinc-950/75 backdrop-blur-xl border border-zinc-800/80 rounded-2xl shadow-2xl">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
          <HeartPulse className="w-4 h-4 text-white animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-tight text-white">KLINIK PSIKOLOGI AI 3D</h1>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
              Dr. Kuro Live
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-zinc-400">
            <span className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-amber-400 animate-ping'}`} />
              {backendOnline ? 'Konseling Online' : 'Konseling Offline (Mock Ready)'}
            </span>
            <span>•</span>
            <span className="truncate max-w-[120px] text-zinc-300 font-mono text-[10px]">{modelName}</span>
          </div>
        </div>
      </div>

      {/* Quick Camera & Stream Controls */}
      <div className="flex items-center gap-2 px-3 py-2 bg-zinc-950/75 backdrop-blur-xl border border-zinc-800/80 rounded-2xl shadow-2xl">
        {/* Camera Angles */}
        <div className="flex items-center gap-1 p-1 bg-zinc-900/80 rounded-xl border border-zinc-800">
          <button
            onClick={() => onCameraChange('face')}
            title="Wajah Konseling (Close Up)"
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
              activeCamera === 'face'
                ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Tatap Muka
          </button>
          <button
            onClick={() => onCameraChange('bust')}
            title="Setengah Badan (Bust)"
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
              activeCamera === 'bust'
                ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Bust
          </button>
          <button
            onClick={() => onCameraChange('full')}
            title="Full Body"
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
              activeCamera === 'full'
                ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Full
          </button>
          <button
            onClick={onResetCamera}
            title="Reset Kamera"
            className="p-1 text-zinc-400 hover:text-teal-400 hover:bg-white/5 rounded-lg transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* OBS Stream Mode */}
        <button
          onClick={onToggleObsMode}
          title="OBS Streaming Mode"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-teal-600/30 to-cyan-600/30 hover:from-teal-600/50 hover:to-cyan-600/50 border border-teal-500/40 text-teal-200 rounded-xl text-xs font-semibold shadow-lg shadow-teal-500/10 transition-all"
        >
          <Video className="w-3.5 h-3.5 text-teal-400" />
          <span>OBS Live</span>
        </button>
      </div>
    </header>
  );
};
