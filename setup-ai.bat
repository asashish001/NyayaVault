@echo off
echo ====================================================
echo NyayaVault Local AI Setup (Windows)
echo ====================================================
echo.

:: Check if Ollama is installed
ollama --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Ollama is not installed!
    echo Please download and install it from: https://ollama.com/download
    echo After installing, run this script again.
    pause
    exit /b
)

echo [+] Ollama is installed.
echo [+] Downloading/Updating the Qwen model (this may take a few minutes)...
ollama pull qwen

echo [+] Downloading/Updating the Llava Vision model (this may take a few minutes)...
ollama pull llava

echo.
echo ====================================================
echo SUCCESS: The AI engine is ready!
echo You can now run 'npm run dev' to start NyayaVault.
echo ====================================================
pause
