@echo off
title ShipTracePro - Vite React Frontend
echo Starting Vite Frontend on port 5173...
cd /d "%~dp0frontend"
if not exist node_modules (
    echo Installing npm dependencies...
    call npm install
)
call npm run dev
pause
