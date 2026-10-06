'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, VRMEmotion } from '@/types/vrm';
import { AudioVisualizer } from './AudioVisualizer';
import { Send, Mic, MicOff, Volume2, VolumeX, Trash2, HeartHandshake, Sparkles, MessageCircle } from 'lucide-react';

interface ChatPanelProps {
  messages: ChatMessage[];
  isGenerating: boolean;
  isSpeaking: boolean;
  autoSpeak: boolean;
  onToggleAutoSpeak: () => void;
  onSendMessage: (text: string) => void;
  onReplayAudio: (audioUrl: string) => void;
  onClearMessages: () => void;
}

const QUICK_PROMPTS = [
  'Coba gombalin aku dong!',
  'Kamu tau gak kenapa aku suka ngobrol sama kamu?',
  'Lagi capek dan burnout banget nih hari ini...',
  'Gimana cara ngurangin overthinking ya?',
  'Bintang di langit kalah terang sama senyumanmu~',
];

const EMOTION_BADGES: Record<VRMEmotion, { label: string; color: string; emoji: string }> = {
  happy: { label: 'Senyum', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', emoji: '😊' },
  blush: { label: 'Salting / Malu', color: 'bg-pink-500/20 text-pink-300 border-pink-500/30', emoji: '😳' },
  relaxed: { label: 'Santai & Tenang', color: 'bg-teal-500/20 text-teal-300 border-teal-500/30', emoji: '🌿' },
  sad: { label: 'Empati', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', emoji: '🥺' },
  angry: { label: 'Ngambek Lucu', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30', emoji: '😤' },
  surprised: { label: 'Kaget Imut', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', emoji: '😲' },
  neutral: { label: 'Netral', color: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30', emoji: '😐' },
};

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  isGenerating,
  isSpeaking,
  autoSpeak,
  onToggleAutoSpeak,
  onSendMessage,
  onReplayAudio,
  onClearMessages,
}) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<unknown>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        (recognitionRef.current as { stop: () => void }).stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as unknown as { SpeechRecognition: unknown }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition: unknown }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Browser Anda belum mendukung Web Speech Recognition. Gunakan Google Chrome atau Edge.');
      return;
    }

    try {
      const recognition = new (SpeechRecognition as new () => {
        continuous: boolean;
        interimResults: boolean;
        lang: string;
        start: () => void;
        stop: () => void;
        onstart: () => void;
        onresult: (e: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => void;
        onerror: (e: { error: string }) => void;
        onend: () => void;
      })();

      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'id-ID';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Speech recognition setup error:', err);
      setIsListening(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isGenerating) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div className="flex flex-col h-[520px] max-h-[80vh] w-full max-w-[430px] bg-zinc-950/85 backdrop-blur-2xl border border-zinc-800/80 rounded-3xl shadow-2xl overflow-hidden pointer-events-auto">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/80 bg-zinc-900/40">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-xs text-white uppercase tracking-wider">Teman Ngobrol & Curhat 3D</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {isSpeaking && <AudioVisualizer isActive={true} barCount={8} />}

          <button
            onClick={onToggleAutoSpeak}
            title={autoSpeak ? 'Suara Aktif' : 'Suara Dimatikan'}
            className={`p-1.5 rounded-lg border transition-all ${
              autoSpeak
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {autoSpeak ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onClearMessages}
            title="Bersihkan Percakapan"
            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-red-400 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-zinc-800">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-zinc-400">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-fuchsia-500/20 border border-cyan-500/30 flex items-center justify-center mb-3">
              <MessageCircle className="w-6 h-6 text-cyan-300" />
            </div>
            <p className="font-semibold text-sm text-white">Teman Ngobrol & Curhat Santai</p>
            <p className="text-xs text-zinc-400 mt-1 max-w-[280px]">
              Bisa curhat masalah sehari-hari, ngobrol santai, atau coba gombalin Zeta!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            const badge = msg.emotion ? EMOTION_BADGES[msg.emotion] : null;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} transition-all`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                    {isUser ? 'Kamu' : 'Zeta 3D'}
                  </span>
                  {badge && (
                    <span
                      className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-md border flex items-center gap-0.5 ${badge.color}`}
                    >
                      <span>{badge.emoji}</span>
                      <span>{badge.label}</span>
                    </span>
                  )}
                </div>

                <div
                  className={`group relative max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed transition-all shadow-md ${
                    isUser
                      ? 'bg-gradient-to-tr from-cyan-600 to-blue-600 text-white rounded-br-none shadow-cyan-900/20'
                      : 'bg-zinc-900/90 text-zinc-100 border border-zinc-800 rounded-bl-none shadow-black/40'
                  }`}
                >
                  <p className="whitespace-pre-wrap select-text">{msg.content}</p>

                  {!isUser && msg.audioUrl && (
                    <div className="mt-2 pt-2 border-t border-zinc-800 flex items-center justify-between">
                      <button
                        onClick={() => onReplayAudio(msg.audioUrl!)}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium transition-colors"
                      >
                        <Volume2 className="w-3 h-3" />
                        Putar Ulang Suara
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {isGenerating && (
          <div className="flex items-center gap-2 p-3 bg-zinc-900/60 rounded-2xl border border-zinc-800/80 w-fit">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" />
            <div className="w-2 h-2 rounded-full bg-fuchsia-400 animate-bounce [animation-delay:0.2s]" />
            <div className="w-2 h-2 rounded-full bg-pink-400 animate-bounce [animation-delay:0.4s]" />
            <span className="text-xs text-zinc-400 font-mono">Zeta sedang merespon...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="px-3 py-2 bg-zinc-950 border-t border-zinc-900 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {QUICK_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => onSendMessage(prompt)}
            disabled={isGenerating}
            className="shrink-0 text-[10px] px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-cyan-300 rounded-full border border-zinc-800 transition-all disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-3 bg-zinc-900/50 border-t border-zinc-800/80 flex items-center gap-2">
        <button
          type="button"
          onClick={toggleListening}
          title={isListening ? 'Mendengarkan...' : 'Bicara via Mic'}
          className={`p-2.5 rounded-xl border transition-all ${
            isListening
              ? 'bg-red-500 text-white border-red-400 animate-pulse'
              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
          }`}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={isListening ? 'Mendengarkan suara Anda...' : 'Ketik curhatan atau gombalan...'}
          disabled={isGenerating}
          className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-colors"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isGenerating}
          className="p-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:opacity-40 text-white rounded-xl shadow-md shadow-cyan-500/20 transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
