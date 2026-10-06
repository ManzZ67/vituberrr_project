import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

class Settings:
    PROJECT_NAME: str = "AI VTuber Interactive Backend"
    VERSION: str = "1.0.0"
    
    # API Keys
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    ELEVENLABS_API_KEY: str = os.getenv("ELEVENLABS_API_KEY", "")
    
    # Providers & Defaults
    DEFAULT_LLM_PROVIDER: str = os.getenv("DEFAULT_LLM_PROVIDER", "mock" if not os.getenv("GEMINI_API_KEY") and not os.getenv("GROQ_API_KEY") and not os.getenv("OPENAI_API_KEY") else "gemini")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    
    # TTS Defaults (Zeta Anime Tuning: High Pitch +40Hz, Rate +10%)
    DEFAULT_TTS_VOICE: str = os.getenv("DEFAULT_TTS_VOICE", "id-ID-GadisNeural")
    DEFAULT_TTS_RATE: str = os.getenv("DEFAULT_TTS_RATE", "+10%")
    DEFAULT_TTS_PITCH: str = os.getenv("DEFAULT_TTS_PITCH", "+40Hz")
    
    # Paths
    STATIC_DIR: Path = BASE_DIR / "static"
    MODELS_DIR: Path = STATIC_DIR / "models"
    AUDIO_DIR: Path = STATIC_DIR / "audio"
    
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

settings = Settings()

settings.MODELS_DIR.mkdir(parents=True, exist_ok=True)
settings.AUDIO_DIR.mkdir(parents=True, exist_ok=True)
