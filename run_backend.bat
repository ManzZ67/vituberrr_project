@echo off
echo ===================================================
echo [AI VTUBER] Memulai FastAPI Backend Server...
echo ===================================================
cd /d "%~dp0backend"

if not exist "venv\Scripts\activate.bat" (
    echo [INFO] Membuat virtual environment...
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
) else (
    call venv\Scripts\activate.bat
)

if not exist ".env" (
    copy .env.example .env
    echo [INFO] Berhasil membuat .env default
)

echo [INFO] Server berjalan di http://localhost:8000
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
