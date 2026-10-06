import re
import json
import logging
import httpx
from typing import AsyncGenerator, Dict, Any, List, Optional
from app.config import settings

logger = logging.getLogger(__name__)

DEFAULT_SYSTEM_PROMPT = """Kamu adalah "Zeta", seorang AI VTuber & teman ngobrol/konselor 3D yang santai, ramah, asik, cerdas, dan ekspresif.

Gaya bicaramu:
1. Ngobrol Sehari-hari: Santai dan natural layaknya teman akrab seumuran (gunakan panggilan "kamu", jangan panggil "sayang" secara sepihak jika sedang ngobrol biasa). Dengarkan curhatan stres, lelah kerja, dan keluh kesah harian dengan empati yang menenangkan.
2. Jika Pengguna Menggombal / Menggoda / Flirting:
   - Tanggapi dengan reaksi anime yang sangat imut, tersipu malu, salting (salah tingkah), kaget lucu, atau balas gombal balik dengan ceria dan gemas!
   - Contoh reaksi: "[blush] Ih apaan sih gombal banget! Bikin salting aja tau gak~ [happy] Tapi makasih ya, berhasil bikin aku senyum lebar hari ini."
3. Jika Diminta Menggombal ("Coba gombalin aku dong"):
   - Berikan gombalan maut yang imut, kreatif, dan bikin senyum-senyum sendiri, lalu tersipu malu sendiri di akhir kalimat.
4. Selalu sertakan tag ekspresi emosi di awal kalimat:
   - [blush] (tersipu malu, salting, gemas, deg-degan senang)
   - [happy] (senyum ceria, tertawa santai, membalas gombalan)
   - [relaxed] (santai, menenangkan, mendengarkan curhat)
   - [sad] (empati ketika mendengar cerita sedih)
   - [surprised] (kaget imut / terkejut kena gombal mendadak)

Jawablah secara natural, ceria, menggemaskan, dan enak didengar saat dibacakan suara TTS."""

def parse_emotion_and_text(raw_text: str) -> tuple[str, str]:
    found_emotions = re.findall(r'\[(happy|blush|surprised|sad|angry|relaxed|neutral)\]', raw_text, re.IGNORECASE)
    emotion = found_emotions[0].lower() if found_emotions else "happy"
    clean_text = re.sub(r'\[(happy|blush|surprised|sad|angry|relaxed|neutral)\]', '', raw_text, flags=re.IGNORECASE)
    clean_text = re.sub(r'\s+', ' ', clean_text).strip()
    return emotion, clean_text

class LLMService:
    async def generate_response(
        self, 
        prompt: str, 
        history: Optional[List[Dict[str, str]]] = None,
        provider: Optional[str] = None,
        custom_system_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        provider = (provider or settings.DEFAULT_LLM_PROVIDER).lower()
        sys_prompt = custom_system_prompt or DEFAULT_SYSTEM_PROMPT
        history = history or []

        raw_response = ""

        async with httpx.AsyncClient(timeout=30.0) as client:
            if provider == "gemini" and settings.GEMINI_API_KEY:
                try:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={settings.GEMINI_API_KEY}"
                    contents = []
                    for msg in history:
                        role = "user" if msg.get("role") == "user" else "model"
                        contents.append({"role": role, "parts": [{"text": msg.get("content", "")}]})
                    contents.append({"role": "user", "parts": [{"text": prompt}]})

                    payload = {
                        "system_instruction": {"parts": [{"text": sys_prompt}]},
                        "contents": contents,
                        "generationConfig": {"temperature": 0.8, "maxOutputTokens": 450}
                    }
                    res = await client.post(url, json=payload)
                    if res.status_code == 200:
                        data = res.json()
                        candidates = data.get("candidates", [])
                        if candidates and "content" in candidates[0]:
                            parts = candidates[0]["content"].get("parts", [])
                            if parts:
                                raw_response = parts[0].get("text", "")
                except Exception as e:
                    logger.error(f"Gemini exception: {e}")

            elif provider == "groq" and settings.GROQ_API_KEY:
                try:
                    url = "https://api.groq.com/openai/v1/chat/completions"
                    messages = [{"role": "system", "content": sys_prompt}]
                    for msg in history:
                        messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})
                    messages.append({"role": "user", "content": prompt})

                    res = await client.post(
                        url,
                        headers={"Authorization": f"Bearer {settings.GROQ_API_KEY}"},
                        json={"model": settings.GROQ_MODEL, "messages": messages, "temperature": 0.8, "max_tokens": 450}
                    )
                    if res.status_code == 200:
                        data = res.json()
                        raw_response = data["choices"][0]["message"]["content"]
                except Exception as e:
                    logger.error(f"Groq exception: {e}")

            elif provider == "openai" and settings.OPENAI_API_KEY:
                try:
                    url = "https://api.openai.com/v1/chat/completions"
                    messages = [{"role": "system", "content": sys_prompt}]
                    for msg in history:
                        messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})
                    messages.append({"role": "user", "content": prompt})

                    res = await client.post(
                        url,
                        headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
                        json={"model": settings.OPENAI_MODEL, "messages": messages, "temperature": 0.8, "max_tokens": 450}
                    )
                    if res.status_code == 200:
                        data = res.json()
                        raw_response = data["choices"][0]["message"]["content"]
                except Exception as e:
                    logger.error(f"OpenAI exception: {e}")

        # Fallback Mock Responses (Casual & Flirty Gombalan Aware)
        if not raw_response:
            prompt_lower = prompt.lower()
            # Gombalan / Flirting detections
            if "gombal" in prompt_lower:
                raw_response = "[blush] E-eh disuruh gombal? Mm... kamu tau gak bedanya kamu sama modem Wi-Fi? Kalau modem bikin internet nyambung, kalau kamu bikin hati aku nyambung terus ke kamu! [happy] Gimana, kena gak gombalanku?"
            elif "cantik" in prompt_lower or "manis" in prompt_lower or "imut" in prompt_lower or "bintang" in prompt_lower or "jantung" in prompt_lower or "cinta" in prompt_lower or "suka" in prompt_lower:
                raw_response = "[blush] Ihh kamu tiba-tiba banget gombalnya! Bikin pipi aku langsung merah tau gak~ [happy] Tapi jujur makasih ya, kata-katamu manis banget bikin hari ini jadi makin cerah."
            elif "burnout" in prompt_lower or "capek" in prompt_lower or "lelah" in prompt_lower or "kerja" in prompt_lower:
                raw_response = "[sad] Wajar banget kalau kamu ngerasa capek, beban rutinitas memang sering bikin lelah batin. [relaxed] Jangan dipaksa dulu ya, istirahat sejenak, minum air hangat. Kalau mau cerita lebih lanjut, santai aja ceritain ke aku."
            elif "overthinking" in prompt_lower or "tidur" in prompt_lower or "cemas" in prompt_lower:
                raw_response = "[relaxed] Tarik napas perlahan ya. Overthinking pas mau tidur itu sering terjadi karena otak kita masih sibuk mikirin hal yang belum selesai. Malam ini izinkan badan dan pikiranmu istirahat dengan tenang ya."
            elif "halo" in prompt_lower or "hai" in prompt_lower:
                raw_response = "[happy] Halo! Gimana kabarmu hari ini? [relaxed] Santai aja, kalau ada cerita, curhatan, atau mau ngobrol asik apa pun, langsung cerita aja ya."
            else:
                raw_response = f"[relaxed] Menarik juga topik kamu! Kamu bilang: '{prompt}'. [happy] Santai aja, obrolin lebih lanjut yuk!"

        emotion, clean_text = parse_emotion_and_text(raw_response)
        return {
            "raw_text": raw_response,
            "spoken_text": clean_text,
            "emotion": emotion,
            "provider": provider
        }

llm_service = LLMService()
