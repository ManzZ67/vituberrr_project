from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from app.services.llm_service import llm_service
from app.services.tts_service import tts_service
from app.config import settings

router = APIRouter(prefix="/api", tags=["Chat & Voice"])

class MessageItem(BaseModel):
    role: str # "user" or "model" / "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str = Field(..., description="User message text")
    history: Optional[List[MessageItem]] = Field(default=[], description="Chat history")
    provider: Optional[str] = Field(default=None, description="gemini | groq | openai | mock")
    system_prompt: Optional[str] = Field(default=None, description="Custom system persona prompt")

class TTSRequest(BaseModel):
    text: str
    voice: Optional[str] = None
    rate: Optional[str] = None
    pitch: Optional[str] = None

class ChatVoiceRequest(BaseModel):
    message: str
    history: Optional[List[MessageItem]] = []
    provider: Optional[str] = None
    voice: Optional[str] = None
    rate: Optional[str] = None
    pitch: Optional[str] = None
    system_prompt: Optional[str] = None

@router.post("/chat")
async def chat_endpoint(req: ChatRequest):
    """
    Generate LLM response with emotion tagging.
    """
    try:
        history_dicts = [{"role": m.role, "content": m.content} for m in req.history] if req.history else []
        result = await llm_service.generate_response(
            prompt=req.message,
            history=history_dicts,
            provider=req.provider,
            custom_system_prompt=req.system_prompt
        )
        return {
            "status": "success",
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/tts")
async def tts_endpoint(req: TTSRequest):
    """
    Synthesize text into speech audio.
    """
    try:
        audio_data = await tts_service.generate_audio(
            text=req.text,
            voice=req.voice,
            rate=req.rate,
            pitch=req.pitch
        )
        return {
            "status": "success",
            "data": audio_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat-voice")
async def chat_voice_endpoint(req: ChatVoiceRequest):
    """
    Generate LLM response and immediately synthesize TTS audio in one call.
    """
    try:
        history_dicts = [{"role": m.role, "content": m.content} for m in req.history] if req.history else []
        llm_res = await llm_service.generate_response(
            prompt=req.message,
            history=history_dicts,
            provider=req.provider,
            custom_system_prompt=req.system_prompt
        )
        
        spoken_text = llm_res.get("spoken_text", "")
        audio_data = None
        if spoken_text:
            audio_data = await tts_service.generate_audio(
                text=spoken_text,
                voice=req.voice,
                rate=req.rate,
                pitch=req.pitch
            )
            
        return {
            "status": "success",
            "data": {
                "llm": llm_res,
                "audio": audio_data
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/voices")
async def get_voices_endpoint():
    """
    List supported voices.
    """
    voices = await tts_service.get_voices()
    return {
        "status": "success",
        "data": voices,
        "default": settings.DEFAULT_TTS_VOICE
    }

@router.get("/config")
async def get_config_endpoint():
    """
    Return backend configuration status (available keys and defaults).
    """
    return {
        "status": "success",
        "data": {
            "has_gemini": bool(settings.GEMINI_API_KEY),
            "has_groq": bool(settings.GROQ_API_KEY),
            "has_openai": bool(settings.OPENAI_API_KEY),
            "default_provider": settings.DEFAULT_LLM_PROVIDER,
            "default_voice": settings.DEFAULT_TTS_VOICE,
            "gemini_model": settings.GEMINI_MODEL,
            "groq_model": settings.GROQ_MODEL,
            "openai_model": settings.OPENAI_MODEL
        }
    }
