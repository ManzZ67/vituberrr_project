import os
import uuid
import base64
import logging
import edge_tts
import httpx
from pathlib import Path
from typing import Dict, Any, List
from app.config import settings

logger = logging.getLogger(__name__)

SUPPORTED_VOICES = [
    # Indonesian VTuber Anime Tunings
    {"id": "id-ID-GadisNeural-Zeta", "name": "🐱 Zeta VTuber Kawaii (+45Hz Anime Tuning)", "lang": "id-ID", "gender": "Female", "default_pitch": "+45Hz", "default_rate": "+12%"},
    {"id": "id-ID-GadisNeural-Cute", "name": "✨ Gadis Sweet Anime (+30Hz Pitch)", "lang": "id-ID", "gender": "Female", "default_pitch": "+30Hz", "default_rate": "+8%"},
    {"id": "id-ID-GadisNeural-Natural", "name": "🌸 Gadis Natural (Formal / Standar)", "lang": "id-ID", "gender": "Female", "default_pitch": "+0Hz", "default_rate": "+0%"},
    {"id": "id-ID-ArdiNeural", "name": "Ardi (Male Voice, Indonesian)", "lang": "id-ID", "gender": "Male", "default_pitch": "+0Hz", "default_rate": "+0%"},
    # Japanese Anime
    {"id": "ja-JP-NanamiNeural", "name": "Nanami (Japanese Anime Kawaii)", "lang": "ja-JP", "gender": "Female", "default_pitch": "+15Hz", "default_rate": "+5%"},
    {"id": "ja-JP-AoiNeural", "name": "Aoi (Japanese Gentle Anime)", "lang": "ja-JP", "gender": "Female", "default_pitch": "+0Hz", "default_rate": "+0%"},
    # English Anime
    {"id": "en-US-AnaNeural", "name": "Ana (English Cute Anime Voice)", "lang": "en-US", "gender": "Female", "default_pitch": "+15Hz", "default_rate": "+5%"},
]

class TTSService:
    def __init__(self):
        self.audio_dir = settings.AUDIO_DIR

    async def get_voices(self) -> List[Dict[str, Any]]:
        return SUPPORTED_VOICES

    async def generate_audio(
        self,
        text: str,
        voice: str = None,
        rate: str = None,
        pitch: str = None
    ) -> Dict[str, Any]:
        """
        Synthesizes speech using Edge-TTS with high-pitch anime tuning or ElevenLabs.
        """
        if not text or not text.strip():
            raise ValueError("Text cannot be empty")

        raw_voice = voice or settings.DEFAULT_TTS_VOICE
        
        # Determine actual edge-tts voice and default pitch
        clean_voice = "id-ID-GadisNeural"
        if "ja-JP" in raw_voice:
            clean_voice = raw_voice.split("-")[0] + "-" + raw_voice.split("-")[1] + "-" + raw_voice.split("-")[2]
        elif "en-US" in raw_voice or "en-GB" in raw_voice:
            clean_voice = raw_voice.split("-")[0] + "-" + raw_voice.split("-")[1] + "-" + raw_voice.split("-")[2]
        elif "Ardi" in raw_voice:
            clean_voice = "id-ID-ArdiNeural"
        else:
            clean_voice = "id-ID-GadisNeural"

        # Apply anime kawaii pitch tuning
        if not pitch:
            if "Zeta" in raw_voice:
                pitch = "+45Hz"
                rate = rate or "+12%"
            elif "Cute" in raw_voice:
                pitch = "+30Hz"
                rate = rate or "+8%"
            else:
                pitch = settings.DEFAULT_TTS_PITCH
                
        rate = rate or settings.DEFAULT_TTS_RATE

        filename = f"{uuid.uuid4().hex}.mp3"
        file_path = self.audio_dir / filename

        # 1. Optional ElevenLabs Voice Cloning (If configured)
        if settings.ELEVENLABS_API_KEY and raw_voice.startswith("elevenlabs:"):
            eleven_voice_id = raw_voice.replace("elevenlabs:", "")
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    res = await client.post(
                        f"https://api.elevenlabs.io/v1/text-to-speech/{eleven_voice_id}",
                        headers={
                            "xi-api-key": settings.ELEVENLABS_API_KEY,
                            "Content-Type": "application/json"
                        },
                        json={
                            "text": text,
                            "model_id": "eleven_multilingual_v2",
                            "voice_settings": {"stability": 0.5, "similarity_boost": 0.8}
                        }
                    )
                    if res.status_code == 200:
                        with open(file_path, "wb") as f:
                            f.write(res.content)
                        audio_base64 = base64.b64encode(res.content).decode("utf-8")
                        return {
                            "audio_base64": audio_base64,
                            "audio_url": f"/static/audio/{filename}",
                            "mime_type": "audio/mpeg",
                            "voice": raw_voice,
                            "text": text
                        }
            except Exception as e:
                logger.error(f"ElevenLabs error, falling back to Edge-TTS: {e}")

        # 2. Edge-TTS with High-Pitch Anime Tuning
        try:
            communicate = edge_tts.Communicate(text, clean_voice, rate=rate, pitch=pitch)
            await communicate.save(str(file_path))

            with open(file_path, "rb") as f:
                audio_bytes = f.read()

            audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")
            audio_url = f"/static/audio/{filename}"

            return {
                "audio_base64": audio_base64,
                "audio_url": audio_url,
                "mime_type": "audio/mpeg",
                "voice": clean_voice,
                "rate": rate,
                "pitch": pitch,
                "text": text
            }
        except Exception as e:
            logger.error(f"TTS generation error: {e}")
            raise RuntimeError(f"Edge-TTS failed: {str(e)}")

tts_service = TTSService()
