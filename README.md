# 🌸 AI VTuber 3D Interactive Web Application

Aplikasi Web AI VTuber interaktif modern berbasis **FastAPI (Backend)** dan **Next.js / React + Three.js + @pixiv/three-vrm (Frontend)** dengan dukungan Model 3D VRM, multi-provider LLM (Gemini, Groq, OpenAI), dan Text-to-Speech (Edge-TTS) dengan fitur **Lip-Sync Audio Analyser** dan ekspresi emosi otomatis.

---

## 🌟 Fitur Utama

- **3D VRM Interactive Avatar:**
  - Rendering 3D realtime dengan Three.js & `@pixiv/three-vrm`.
  - Animasi natural: pernapasan (idle breathing), kedipan mata otomatis (blinking), dan gerakan kepala mengikuti kursor mouse (look-at tracking).
  - **Real-time Lip-Sync**: Analisis spektrum frekuensi audio Web Audio API yang secara dinamis menggerakkan blendshape mulut (`aa`, `ih`, `ou`, `ee`, `oh`).
  - **Ekspresi Emosi Dinamis**: Blendshapes ekspresi otomatis dari respon AI (`happy`, `blush`, `surprised`, `sad`, `angry`, `relaxed`, `neutral`) dan manual live triggers (shortcut tombol keyboard `1` - `7`).
  - **Sudut Kamera Presets**: Face (Close-up), Bust (Setengah badan), Full (Seluruh badan), serta Orbit Controls interaktif.
  - **VRM Model Uploader & Switcher**: Drag & drop file `.vrm` kustom Anda sendiri langsung ke layar.

- **AI Brain & Persona (FastAPI):**
  - Dukungan multi-provider: **Google Gemini API**, **Groq (Llama 3.1)**, **OpenAI (GPT-4o)**, serta **Offline / Mock Mode** yang langsung bisa dimainkan tanpa API key.
  - Preset Persona: Ceria & Lucu, Tsundere Imut, Gamer Pro, dan Asisten AI.
  - Custom Persona System Prompt Editor.

- **Suara & Text-to-Speech (Edge-TTS):**
  - Kualitas suara natural & gratis via Microsoft Edge-TTS.
  - Pilihan suara multi-bahasa: Bahasa Indonesia (`Gadis`, `Ardi`), Jepang (`Nanami`, `Keita`, `Aoi`), dan Inggris (`Ana`, `Jenny`, `Guy`).
  - Kontrol kecepatan (rate) dan tinggi nada (pitch).

- **Interaksi & Streaming (OBS Ready):**
  - **Speech-to-Text (STT)**: Berbicara langsung ke VTuber menggunakan mikrofon browser (Web Speech API).
  - **OBS Chroma Key & Transparent Mode**: Mode layar hijau dan transparan untuk dimasukkan ke OBS Studio sebagai Browser Source saat live streaming!

---

## 🚀 Cara Menjalankan (Cara Cepat)

### 1. Satu Klik (Windows)
Cukup double-click file:
```cmd
run_all.bat
```
Script ini akan otomatis mengaktifkan virtual environment backend, menjalankan server FastAPI di port `8000`, dan menjalankan Next.js di port `3000`.

---

### 2. Menjalankan Manual

#### Backend (FastAPI):
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- **Backend API URL**: `http://localhost:8000`
- **Swagger Docs**: `http://localhost:8000/docs`

#### Frontend (Next.js):
```bash
cd frontend
npm install
npm run dev
```
- **Frontend URL**: `http://localhost:3000`

---

## 🔑 Konfigurasi API Key (Opsional)

Buka file `backend/.env` dan masukkan API key Anda jika ingin menggunakan LLM online:

```env
# Gemini API Key (Dapatkan gratis di https://aistudio.google.com/)
GEMINI_API_KEY=your_gemini_api_key_here

# Groq API Key (Dapatkan di https://console.groq.com/)
GROQ_API_KEY=your_groq_api_key_here

# OpenAI API Key (Opsional)
OPENAI_API_KEY=your_openai_api_key_here

# Provider aktif (gemini | groq | openai | mock)
DEFAULT_LLM_PROVIDER=gemini
```
*Catatan: Jika API key belum diisi, sistem otomatis berjalan dalam **Mock / Offline Mode** sehingga semua fitur 3D, chat interaktif, dan animasi tetap dapat dicoba secara instan.*

---

## 🎭 Shortcut Keyboard

| Tombol | Aksi Ekspresi VRM |
|---|---|
| `1` | Senang (Happy / Smile) |
| `2` | Tersipu (Blush) |
| `3` | Kaget (Surprised) |
| `4` | Sedih (Sad) |
| `5` | Ngambek / Kesal Lucu (Pouty / Angry) |
| `6` | Santai (Relaxed) |
| `7` | Netral (Neutral) |

---

## 🎥 Integrasi OBS Studio (Live Streaming)

1. Buka **Control Panel** di web VTuber > pilih tab **3D & Studio**.
2. Pilih tema **OBS Green Screen** atau **OBS Transparan**.
3. Klik tombol **OBS Mode** di pojok kanan atas untuk menyembunyikan semua tombol UI.
4. Di OBS Studio, tambahkan sumber **Browser Source**:
   - URL: `http://localhost:3000`
   - Width: `1920`, Height: `1080`
5. Jika menggunakan Green Screen, tambahkan filter **Chroma Key** pada Browser Source di OBS.
