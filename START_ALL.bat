@echo off
title ShipTracePro - Launch All Services
echo ===================================================
echo     ShipTracePro - Full Platform Launcher
echo ===================================================
echo.
echo 1. Launching Spring Boot Backend (Port 8080)...
start "ShipTracePro Backend [8080]" cmd /c "%~dp0START_BACKEND.bat"

echo 2. Launching Python ML Engine (Port 5000)...
start "ShipTracePro ML Service [5000]" cmd /c "%~dp0START_ML_SERVICE.bat"

echo 3. Launching React Vite Frontend (Port 5173)...
start "ShipTracePro Frontend [5173]" cmd /c "%~dp0START_FRONTEND.bat"

echo.
echo All services launched!
echo Waiting for frontend to start...
timeout /t 5 >nul

start http://localhost:5173
echo Opened portal at http://localhost:5173
echo.
pause
