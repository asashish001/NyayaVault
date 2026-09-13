#!/bin/bash
echo "===================================================="
echo "NyayaVault Local AI Setup (Mac/Linux)"
echo "===================================================="
echo ""

# Check if Ollama is installed
if ! command -v ollama &> /dev/null
then
    echo "[!] Ollama is not installed!"
    echo "[+] Downloading and installing Ollama..."
    curl -fsSL https://ollama.com/install.sh | sh
else
    echo "[+] Ollama is already installed."
fi

echo "[+] Downloading/Updating the Qwen model (this may take a few minutes)..."
ollama pull qwen

echo "[+] Downloading/Updating the Llava Vision model (this may take a few minutes)..."
ollama pull llava

echo ""
echo "===================================================="
echo "SUCCESS: The AI engine is ready!"
echo "You can now run 'npm run dev' to start NyayaVault."
echo "===================================================="
