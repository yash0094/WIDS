@echo off
title Self-Explaining Wireless IDS - Setup & Launcher
echo ======================================================================
echo    Self-Explaining Wireless IDS - Fresh Laptop 1-Click Setup
echo ======================================================================
echo.

:: 1. Check Python installation
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not added to PATH!
    echo Please install Python 3.10, 3.11, or 3.12 from https://www.python.org/
    echo Make sure to check the box: "Add python.exe to PATH" during installation.
    echo.
    pause
    exit /b 1
)

echo [+] Python detected:
python --version
echo.

:: 2. Create virtual environment if not present
if not exist "venv" (
    echo [*] Creating isolated Python virtual environment (venv)...
    python -m venv venv
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to create virtual environment.
        pause
        exit /b 1
    )
    echo [+] Virtual environment created.
) else (
    echo [+] Virtual environment (venv) already exists.
)

:: 3. Activate virtual environment
call venv\Scripts\activate.bat

:: 4. Upgrade pip and install requirements
echo [*] Installing required Python dependencies...
python -m pip install --upgrade pip
pip install -r backend\requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Dependency installation encountered an issue.
    pause
    exit /b 1
)
echo [+] All dependencies installed successfully.
echo.

:: 5. Launch turnkey application
echo ======================================================================
echo  [+] Launching Self-Explaining Wireless IDS...
echo ======================================================================
python start.py %*

pause

