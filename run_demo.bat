@echo off
title Self-Explaining Wireless IDS
echo ======================================================================
echo    Self-Explaining Wireless IDS - Capstone Live Demo Launcher
echo ======================================================================
echo.

if exist "venv\Scripts\activate.bat" (
    echo [+] Activating virtual environment...
    call venv\Scripts\activate.bat
)

python start.py
pause
