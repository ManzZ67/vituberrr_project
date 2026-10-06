@echo off
echo ===================================================
echo [AI VTUBER] Memulai Next.js Frontend Web Studio...
echo ===================================================
cd /d "%~dp0frontend"

if not exist "node_modules" (
    echo [INFO] Menginstall dependensi frontend...
    npm install
)

echo [INFO] Frontend berjalan di http://localhost:3000
npm run dev
pause
