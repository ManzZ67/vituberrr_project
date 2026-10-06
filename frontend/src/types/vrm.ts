export type VRMEmotion = 'happy' | 'angry' | 'sad' | 'surprised' | 'relaxed' | 'neutral' | 'blush';

export type CameraPreset = 'face' | 'bust' | 'full';

export type BackgroundTheme = 'cyberpunk' | 'cozy' | 'neon-dark' | 'chroma-green' | 'transparent';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  spokenText?: string;
  emotion?: VRMEmotion;
  audioUrl?: string;
  timestamp: number;
}

export interface VoiceOption {
  id: string;
  name: string;
  lang: string;
  gender: string;
}

export interface BackendConfig {
  has_gemini: boolean;
  has_groq: boolean;
  has_openai: boolean;
  default_provider: string;
  default_voice: string;
  gemini_model: string;
  groq_model: string;
  openai_model: string;
}

export interface ModelOption {
  filename: string;
  url: string;
  size_mb: number;
}
