@echo off
title ShipTracePro - Python ML Service
echo Starting Python ML Service on port 5000...
cd /d "%~dp0ml_service"
python -m pip install -r requirements.txt --quiet
python app.py
pause
