@echo off
echo ===================================================
echo [AI VTUBER] Menjalankan Backend dan Frontend...
echo ===================================================

start "AI VTuber Backend (FastAPI)" cmd /c "%~dp0run_backend.bat"
start "AI VTuber Frontend (Next.js)" cmd /c "%~dp0run_frontend.bat"

echo.
echo [INFO] Backend:  http://localhost:8000
echo [INFO] Frontend: http://localhost:3000
echo [INFO] Swagger:  http://localhost:8000/docs
echo.
pause
