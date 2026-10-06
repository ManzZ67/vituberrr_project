'use client';

import React, { useState } from 'react';
import { VRMEmotion, BackgroundTheme, VoiceOption } from '@/types/vrm';
import {
  Settings,
  Brain,
  Mic,
  Palette,
  Upload,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Play,
  CheckCircle2,
  MessageCircle,
} from 'lucide-react';

interface ControlPanelProps {
  provider: string;
  onProviderChange: (provider: string) => void;
  systemPrompt: string;
  onSystemPromptChange: (prompt: string) => void;
  voices: VoiceOption[];
  selectedVoice: string;
  onVoiceChange: (voice: string) => void;
  speechRate: string;
  onSpeechRateChange: (rate: string) => void;
  speechPitch: string;
  onSpeechPitchChange: (pitch: string) => void;
  onTestVoice: () => void;
  currentEmotion: VRMEmotion;
  onTriggerEmotion: (emotion: VRMEmotion) => void;
  theme: BackgroundTheme;
  onThemeChange: (theme: BackgroundTheme) => void;
  onUploadModel: (file: File) => void;
  modelName: string;
  availableModels: { filename: string; url: string; size_mb: number }[];
  onSelectModel: (url: string) => void;
}

const CASUAL_PRESETS = [
  {
    name: '💬 Teman Curhat Santai & Asik (Default)',
    prompt:
      'Kamu adalah "Zeta", AI VTuber dan teman ngobrol/konselor yang santai, asik, ramah, dan suportif. Bicaralah santai seperti teman akrab (gunakan kata "kamu", jangan gunakan kata panggilan berlebihan seperti sayang). Dengarkan keluhan stres sehari-hari dengan baik, beri saran yang masuk akal dan menenangkan. Gunakan tag [happy], [relaxed], [sad], [blush], [surprised] pada responmu.',
  },
  {
    name: '🩺 Konselor Psikologi Solutif',
    prompt:
      'Kamu adalah konselor psikologis yang ramah, santai, dan solutif. Bantu urai overthinking, stres kerja/kuliah, dan berikan tips praktis yang logis dan menenangkan tanpa menggurui.',
  },
  {
    name: '🎮 Partner Ngobrol Hobi & Santai',
    prompt:
      'Kamu adalah partner ngobrol yang seru untuk membahas kegiatan harian, game, teknologi, dan rutinitas santai sehari-hari.',
  },
];

const EMOTION_BUTTONS: { id: VRMEmotion; label: string; emoji: string; color: string }[] = [
  { id: 'happy', label: 'Senyum Santai', emoji: '😊', color: 'hover:border-emerald-500 hover:text-emerald-300' },
  { id: 'relaxed', label: 'Tenang & Nyaman', emoji: '🌿', color: 'hover:border-teal-500 hover:text-teal-300' },
  { id: 'sad', label: 'Empati', emoji: '🥺', color: 'hover:border-blue-500 hover:text-blue-300' },
  { id: 'blush', label: 'Ramah / Apresiasi', emoji: '☺️', color: 'hover:border-pink-500 hover:text-pink-300' },
  { id: 'surprised', label: 'Tertarik / Kaget', emoji: '😲', color: 'hover:border-amber-500 hover:text-amber-300' },
];

const THEME_OPTIONS: { id: BackgroundTheme; label: string; bg: string }[] = [
  { id: 'cozy', label: 'Kamar Santai Cozy', bg: 'bg-gradient-to-r from-violet-950 to-pink-950' },
  { id: 'cyberpunk', label: 'Cyber Room Neon', bg: 'bg-gradient-to-r from-purple-900 to-indigo-950' },
  { id: 'neon-dark', label: 'Midnight Black Minimalist', bg: 'bg-gradient-to-r from-zinc-950 to-neutral-900' },
  { id: 'chroma-green', label: 'OBS Green Screen', bg: 'bg-green-500 text-black' },
  { id: 'transparent', label: 'OBS Transparan', bg: 'bg-zinc-800 border-dashed border' },
];

export const ControlPanel: React.FC<ControlPanelProps> = ({
  provider,
  onProviderChange,
  systemPrompt,
  onSystemPromptChange,
  voices,
  selectedVoice,
  onVoiceChange,
  speechRate,
  onSpeechRateChange,
  speechPitch,
  onSpeechPitchChange,
  onTestVoice,
  currentEmotion,
  onTriggerEmotion,
  theme,
  onThemeChange,
  onUploadModel,
  modelName,
  availableModels,
  onSelectModel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'persona' | 'voice' | 'studio'>('persona');

  return (
    <div className="relative pointer-events-auto flex items-start">
      <button
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? 'Tutup Pengaturan' : 'Buka Pengaturan Karakter'}
        className="p-3 bg-zinc-950/80 backdrop-blur-xl border border-zinc-800/80 text-zinc-300 hover:text-white rounded-2xl shadow-2xl flex items-center gap-2 transition-all hover:scale-105"
      >
        <MessageCircle className="w-5 h-5 text-cyan-400" />
        <span className="text-xs font-semibold hidden md:inline">Karakter & Suara</span>
        {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {isOpen && (
        <div className="absolute top-0 left-14 w-[360px] max-w-[90vw] max-h-[85vh] bg-zinc-950/90 backdrop-blur-2xl border border-zinc-800/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-50 animate-in fade-in slide-in-from-left-4 duration-300">
          <div className="flex border-b border-zinc-800/80 bg-zinc-900/50 p-1.5 gap-1">
            <button
              onClick={() => setActiveTab('persona')}
              className={`flex-1 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'persona'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              <Brain className="w-3.5 h-3.5 text-cyan-400" />
              <span>Gaya Ngobrol</span>
            </button>
            <button
              onClick={() => setActiveTab('voice')}
              className={`flex-1 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'voice'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              <Mic className="w-3.5 h-3.5 text-fuchsia-400" />
              <span>Suara TTS</span>
            </button>
            <button
              onClick={() => setActiveTab('studio')}
              className={`flex-1 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'studio'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              <Palette className="w-3.5 h-3.5 text-teal-400" />
              <span>3D & Ruang</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-zinc-800">
            {activeTab === 'persona' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 mb-1.5 block">Preset Gaya Bicara</label>
                  <div className="space-y-1.5">
                    {CASUAL_PRESETS.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => onSystemPromptChange(p.prompt)}
                        className="w-full px-3 py-2.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-left text-zinc-200 hover:text-cyan-300 transition-colors"
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 mb-1.5 block">Model AI (Provider)</label>
                  <select
                    value={provider}
                    onChange={(e) => onProviderChange(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="gemini">Google Gemini API (Cepat & Pintar)</option>
                    <option value="groq">Groq Llama 3.1 (Respon Kilat)</option>
                    <option value="openai">OpenAI GPT-4o Mini</option>
                    <option value="mock">Offline / Mock Mode (Siap Pakai)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 mb-1.5 block">Custom System Prompt</label>
                  <textarea
                    rows={6}
                    value={systemPrompt}
                    onChange={(e) => onSystemPromptChange(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>
            )}

            {activeTab === 'voice' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 mb-1.5 block">Pilihan Suara</label>
                  <select
                    value={selectedVoice}
                    onChange={(e) => onVoiceChange(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-fuchsia-500"
                  >
                    {voices.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-300 font-medium">Tinggi Nada (Pitch)</span>
                    <span className="font-mono text-fuchsia-400">{speechPitch}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { label: 'Normal', val: '+0Hz' },
                      { label: 'Sweet', val: '+25Hz' },
                      { label: 'Anime', val: '+40Hz' },
                      { label: 'Kawaii', val: '+50Hz' },
                    ].map((item) => (
                      <button
                        key={item.val}
                        onClick={() => onSpeechPitchChange(item.val)}
                        className={`py-1.5 px-1 text-[11px] rounded-lg border text-center transition-all ${
                          speechPitch === item.val
                            ? 'bg-fuchsia-500/20 border-fuchsia-400 text-fuchsia-300 font-bold'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <div>{item.label}</div>
                        <div className="text-[9px] text-zinc-500 font-mono">{item.val}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-300 font-medium">Kecepatan Bicara</span>
                    <span className="font-mono text-teal-400">{speechRate}</span>
                  </div>
                  <div className="flex gap-2">
                    {['+0%', '+8%', '+12%', '+18%'].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => onSpeechRateChange(rate)}
                        className={`flex-1 py-1 text-xs rounded-lg border transition-all ${
                          speechRate === rate
                            ? 'bg-teal-500/20 border-teal-400 text-teal-300'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                        }`}
                      >
                        {rate}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={onTestVoice}
                  className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-1.5 transition-all"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Uji Coba Suara</span>
                </button>
              </div>
            )}

            {activeTab === 'studio' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    Ekspresi Wajah
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {EMOTION_BUTTONS.map((em) => (
                      <button
                        key={em.id}
                        onClick={() => onTriggerEmotion(em.id)}
                        className={`px-2 py-2 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                          currentEmotion === em.id
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-sm'
                            : `bg-zinc-900/60 border-zinc-800 text-zinc-400 ${em.color}`
                        }`}
                      >
                        <span className="text-base">{em.emoji}</span>
                        <span className="text-[10px]">{em.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-cyan-400" />
                      Model Avatar 3D
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono truncate max-w-[140px]">{modelName}</span>
                  </label>

                  <label className="border-2 border-dashed border-zinc-800 hover:border-cyan-500/60 bg-zinc-900/40 hover:bg-zinc-900/80 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all group">
                    <Upload className="w-6 h-6 text-zinc-500 group-hover:text-cyan-400 mb-1 transition-colors" />
                    <span className="text-xs font-medium text-zinc-300 group-hover:text-white">
                      Upload Model 3D (.VRM)
                    </span>
                    <input
                      type="file"
                      accept=".vrm"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onUploadModel(file);
                      }}
                    />
                  </label>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 mb-2 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-amber-400" />
                    Tema Background
                  </label>
                  <div className="space-y-1.5">
                    {THEME_OPTIONS.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => onThemeChange(t.id)}
                        className={`w-full px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-all border ${
                          theme === t.id
                            ? 'border-cyan-400 bg-cyan-950/40 text-white'
                            : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-3.5 h-3.5 rounded-full ${t.bg}`} />
                          <span>{t.label}</span>
                        </div>
                        {theme === t.id && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
