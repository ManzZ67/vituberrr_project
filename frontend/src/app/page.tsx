'use client';

import React, { useState, useEffect, useRef } from 'react';
import { VRMCanvas, VRMCanvasRef } from '@/components/vrm/VRMCanvas';
import { Header } from '@/components/ui/Header';
import { ChatPanel } from '@/components/ui/ChatPanel';
import { ControlPanel } from '@/components/ui/ControlPanel';
import { VRMEmotion, CameraPreset, BackgroundTheme, ChatMessage, VoiceOption } from '@/types/vrm';
import { api } from '@/lib/api';
import confetti from 'canvas-confetti';
import { Sparkles } from 'lucide-react';

export default function Home() {
  const vrmRef = useRef<VRMCanvasRef>(null);

  // Connection & Config State
  const [backendOnline, setBackendOnline] = useState<boolean>(false);
  const [modelUrl, setModelUrl] = useState<string>('/models/avatar.vrm');
  const [modelName, setModelName] = useState<string>('Zeta 3D (Avatar)');
  const [availableModels, setAvailableModels] = useState<{ filename: string; url: string; size_mb: number }[]>([]);

  // Studio & Display State
  const [theme, setTheme] = useState<BackgroundTheme>('cyberpunk');
  const [activeCamera, setActiveCamera] = useState<CameraPreset>('bust');
  const [currentEmotion, setCurrentEmotion] = useState<VRMEmotion>('happy');
  const [obsMode, setObsMode] = useState<boolean>(false);

  // AI & Voice State - Natural, Casual Friend & Support
  const [provider, setProvider] = useState<string>('gemini');
  const [systemPrompt, setSystemPrompt] = useState<string>(
    'Kamu adalah "Zeta", AI VTuber dan teman ngobrol/konselor yang santai, asik, ramah, dan suportif. Bicaralah santai seperti teman akrab (gunakan kata "kamu", jangan gunakan kata panggilan berlebihan seperti sayang). Dengarkan keluhan stres sehari-hari dengan baik, beri saran yang masuk akal dan menenangkan. Gunakan tag [happy], [relaxed], [sad], [blush], [surprised] pada responmu.'
  );
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('id-ID-GadisNeural');
  const [speechRate, setSpeechRate] = useState<string>('+8%');
  const [speechPitch, setSpeechPitch] = useState<string>('+30Hz');
  const [autoSpeak, setAutoSpeak] = useState<boolean>(true);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [hasGreeted, setHasGreeted] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const initData = async () => {
      const isOnline = await api.checkHealth();
      if (!isMounted) return;
      setBackendOnline(isOnline);

      if (isOnline) {
        const config = await api.getConfig();
        if (config) {
          setProvider(config.default_provider || 'gemini');
        }

        const voiceList = await api.getVoices();
        if (voiceList && voiceList.length > 0) setVoices(voiceList);

        const models = await api.getModels();
        if (models && models.length > 0) setAvailableModels(models);
      } else {
        setVoices([
          { id: 'id-ID-GadisNeural', name: '✨ Suara Zeta (Santai & Ramah ID)', lang: 'id-ID', gender: 'Female' },
          { id: 'id-ID-ArdiNeural', name: 'Ardi (Male, Indonesian)', lang: 'id-ID', gender: 'Male' },
          { id: 'ja-JP-NanamiNeural', name: 'Nanami (Anime Kawaii, Japanese)', lang: 'ja-JP', gender: 'Female' },
          { id: 'en-US-AnaNeural', name: 'Ana (Cute & Sweet, English US)', lang: 'en-US', gender: 'Female' },
        ]);
      }
    };

    initData();
    const interval = setInterval(async () => {
      const isOnline = await api.checkHealth();
      if (isMounted) setBackendOnline(isOnline);
    }, 8000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      const emotionMap: Record<string, VRMEmotion> = {
        '1': 'happy',
        '2': 'relaxed',
        '3': 'sad',
        '4': 'blush',
        '5': 'surprised',
      };

      if (emotionMap[e.key]) {
        handleTriggerEmotion(emotionMap[e.key]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Natural greeting
  const handleZetaGreeting = async () => {
    setHasGreeted(true);
    const greetingText = 'Halo! Zeta di sini. Gimana kabarmu hari ini? Kalau ada cerita atau unek-unek santai, cerita aja ya.';
    
    try {
      setIsSpeaking(true);
      setCurrentEmotion('happy');
      vrmRef.current?.setEmotion('happy');

      confetti({
        particleCount: 25,
        spread: 50,
        origin: { y: 0.7 },
        colors: ['#38bdf8', '#2dd4bf', '#f472b6'],
      });

      const res = await api.generateTTS(greetingText, selectedVoice, speechRate, speechPitch);
      if (res.audio_base64) {
        const audioSrc = `data:audio/mpeg;base64,${res.audio_base64}`;
        
        const initialMsg: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `[happy] ${greetingText}`,
          spokenText: greetingText,
          emotion: 'happy',
          audioUrl: audioSrc,
          timestamp: Date.now(),
        };
        setMessages([initialMsg]);

        await vrmRef.current?.playAudio(audioSrc, () => {
          setIsSpeaking(false);
          setCurrentEmotion('relaxed');
        });
      }
    } catch (e) {
      console.warn('Greeting failed:', e);
      setIsSpeaking(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isGenerating) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsGenerating(true);

    try {
      const history = messages.slice(-6).map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      }));

      const response = await api.sendChatVoice({
        message: text,
        history,
        provider,
        voice: selectedVoice,
        rate: speechRate,
        pitch: speechPitch,
        system_prompt: systemPrompt,
      });

      const emotion = (response.llm.emotion as VRMEmotion) || 'relaxed';
      setCurrentEmotion(emotion);
      vrmRef.current?.setEmotion(emotion);

      let audioSrc = '';
      if (response.audio?.audio_base64) {
        audioSrc = `data:audio/mpeg;base64,${response.audio.audio_base64}`;
      } else if (response.audio?.audio_url) {
        audioSrc = `${api.baseUrl}${response.audio.audio_url}`;
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.llm.raw_text,
        spokenText: response.llm.spoken_text,
        emotion,
        audioUrl: audioSrc,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (autoSpeak && audioSrc) {
        setIsSpeaking(true);
        await vrmRef.current?.playAudio(audioSrc, () => {
          setIsSpeaking(false);
          setCurrentEmotion('relaxed');
          vrmRef.current?.setEmotion('relaxed');
        });
      }
    } catch (err) {
      console.error('Chat error:', err);
      const fallbackMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `[relaxed] Aku dengerin kok. Santai aja, ceritain pelan-pelan ya.`,
        spokenText: `Aku dengerin kok. Santai aja, ceritain pelan-pelan ya.`,
        emotion: 'relaxed',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReplayAudio = async (audioUrl: string) => {
    if (!audioUrl) return;
    setIsSpeaking(true);
    await vrmRef.current?.playAudio(audioUrl, () => {
      setIsSpeaking(false);
    });
  };

  const handleTestVoice = async () => {
    try {
      const sampleText = 'Halo! Ini tes suara santai Zeta. Gimana, udah enak didengar belum?';
      const res = await api.generateTTS(sampleText, selectedVoice, speechRate, speechPitch);
      if (res.audio_base64) {
        const audioSrc = `data:audio/mpeg;base64,${res.audio_base64}`;
        setIsSpeaking(true);
        await vrmRef.current?.playAudio(audioSrc, () => {
          setIsSpeaking(false);
        });
      }
    } catch (e) {
      console.error('Failed to test voice:', e);
      alert('Gagal menguji suara.');
    }
  };

  const handleTriggerEmotion = (emotion: VRMEmotion) => {
    setCurrentEmotion(emotion);
    vrmRef.current?.setEmotion(emotion);
  };

  const handleCameraChange = (preset: CameraPreset) => {
    setActiveCamera(preset);
    vrmRef.current?.setCameraPreset(preset);
  };

  const handleUploadModel = async (file: File) => {
    setModelName(file.name);
    await vrmRef.current?.loadModel(file);
    if (backendOnline) {
      try {
        await api.uploadVRM(file);
        const models = await api.getModels();
        setAvailableModels(models);
      } catch (e) {
        console.warn('Backend upload skipped:', e);
      }
    }
  };

  const handleSelectModel = async (url: string) => {
    const fullUrl = url.startsWith('http') ? url : `${api.baseUrl}${url}`;
    setModelUrl(fullUrl);
    setModelName(url.split('/').pop() || 'Model');
    await vrmRef.current?.loadModel(fullUrl);
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black flex flex-col">
      <div className="absolute inset-0 z-0">
        <VRMCanvas
          ref={vrmRef}
          modelUrl={modelUrl}
          theme={theme}
          currentEmotion={currentEmotion}
          onModelLoaded={(name) => setModelName(name)}
        />
      </div>

      <Header
        backendOnline={backendOnline}
        activeCamera={activeCamera}
        onCameraChange={handleCameraChange}
        onResetCamera={() => vrmRef.current?.resetCamera()}
        obsMode={obsMode}
        onToggleObsMode={() => setObsMode(!obsMode)}
        theme={theme}
        onThemeChange={setTheme}
        modelName={modelName}
      />

      {!obsMode && !hasGreeted && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
          <button
            onClick={handleZetaGreeting}
            className="flex items-center gap-2.5 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-full shadow-2xl shadow-cyan-500/30 text-xs font-bold uppercase tracking-wider transition-all hover:scale-105"
          >
            <Sparkles className="w-4 h-4" />
            <span>Sapa Zeta 🎙️</span>
          </button>
        </div>
      )}

      {!obsMode && (
        <div className="relative z-10 w-full h-full flex justify-between items-end p-4 md:p-6 pointer-events-none">
          <div className="flex flex-col items-start gap-4 mb-2">
            <ControlPanel
              provider={provider}
              onProviderChange={setProvider}
              systemPrompt={systemPrompt}
              onSystemPromptChange={setSystemPrompt}
              voices={voices}
              selectedVoice={selectedVoice}
              onVoiceChange={setSelectedVoice}
              speechRate={speechRate}
              onSpeechRateChange={setSpeechRate}
              speechPitch={speechPitch}
              onSpeechPitchChange={setSpeechPitch}
              onTestVoice={handleTestVoice}
              currentEmotion={currentEmotion}
              onTriggerEmotion={handleTriggerEmotion}
              theme={theme}
              onThemeChange={setTheme}
              onUploadModel={handleUploadModel}
              modelName={modelName}
              availableModels={availableModels}
              onSelectModel={handleSelectModel}
            />

            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-zinc-950/70 backdrop-blur-md rounded-xl border border-zinc-800 text-[11px] text-zinc-300 pointer-events-auto">
              <span className="font-mono text-cyan-400">Ekspresi (1-5):</span>
              <span>1=Senyum, 2=Santai, 3=Sedih, 4=Apresiasi, 5=Kaget</span>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <ChatPanel
              messages={messages}
              isGenerating={isGenerating}
              isSpeaking={isSpeaking}
              autoSpeak={autoSpeak}
              onToggleAutoSpeak={() => setAutoSpeak(!autoSpeak)}
              onSendMessage={handleSendMessage}
              onReplayAudio={handleReplayAudio}
              onClearMessages={() => setMessages([])}
            />
          </div>
        </div>
      )}
    </main>
  );
}
