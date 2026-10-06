const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export interface ChatVoiceResponse {
  llm: {
    raw_text: string;
    spoken_text: string;
    emotion: string;
    provider: string;
  };
  audio?: {
    audio_base64: string;
    audio_url: string;
    voice: string;
  };
}

export const api = {
  baseUrl: BACKEND_URL,

  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${BACKEND_URL}/`, { method: 'GET', cache: 'no-store' });
      return res.ok;
    } catch {
      return false;
    }
  },

  async getConfig() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/config`);
      const data = await res.json();
      return data.data;
    } catch (e) {
      console.warn('Could not fetch backend config:', e);
      return null;
    }
  },

  async getVoices() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/voices`);
      const data = await res.json();
      return data.data;
    } catch (e) {
      console.warn('Could not fetch voices, using defaults:', e);
      return [
        { id: 'id-ID-GadisNeural', name: 'Gadis (Female, Indonesian)', lang: 'id-ID', gender: 'Female' },
        { id: 'id-ID-ArdiNeural', name: 'Ardi (Male, Indonesian)', lang: 'id-ID', gender: 'Male' },
        { id: 'ja-JP-NanamiNeural', name: 'Nanami (Female, Anime Japanese)', lang: 'ja-JP', gender: 'Female' },
        { id: 'en-US-AnaNeural', name: 'Ana (Female Cute, English US)', lang: 'en-US', gender: 'Female' },
      ];
    }
  },

  async getModels() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/models`);
      const data = await res.json();
      return data.data;
    } catch (e) {
      console.warn('Could not fetch backend models:', e);
      return [];
    }
  },

  async sendChatVoice(params: {
    message: string;
    history?: { role: string; content: string }[];
    provider?: string;
    voice?: string;
    rate?: string;
    pitch?: string;
    system_prompt?: string;
  }): Promise<ChatVoiceResponse> {
    const res = await fetch(`${BACKEND_URL}/api/chat-voice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Network request failed' }));
      throw new Error(err.detail || 'Failed to chat with VTuber');
    }

    const json = await res.json();
    return json.data;
  },

  async generateTTS(text: string, voice?: string, rate?: string, pitch?: string) {
    const res = await fetch(`${BACKEND_URL}/api/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice, rate, pitch }),
    });

    if (!res.ok) {
      throw new Error('Failed to generate TTS');
    }

    const json = await res.json();
    return json.data;
  },

  async uploadVRM(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${BACKEND_URL}/api/models/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      throw new Error('Failed to upload VRM file');
    }

    const json = await res.json();
    return json.data;
  },
};
