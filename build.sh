#!/bin/bash
set -e

echo "🚀 Build MARCO-XMD pour Render"
echo "================================"

# 1. Installer les dépendances Node
echo "📦 Installation des dépendances Node..."
npm install --omit=dev

# 2. Installer les dépendances Python (edge-tts)
echo "🐍 Installation de edge-tts..."
pip3 install --no-cache-dir --break-system-packages -r requirements.txt || \
pip install --no-cache-dir -r requirements.txt || \
echo "⚠️ Impossible d'installer edge-tts (voice_studio ne marchera pas)"

# 3. Télécharger yt-dlp (binaire autonome)
echo "⬇️  Téléchargement de yt-dlp..."
mkdir -p bin
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux -o bin/yt-dlp
chmod +x bin/yt-dlp
export PATH="$PWD/bin:$PATH"

# 4. Vérifier ffmpeg (déjà installé sur Render ?)
if command -v ffmpeg &> /dev/null; then
    echo "✅ ffmpeg disponible"
else
    echo "⚠️ ffmpeg absent - utilisation de ffmpeg-static"
fi

# 5. Vérifications finales
echo ""
echo "================================"
echo "✅ Build terminé"
echo "================================"
node --version
python3 --version
./bin/yt-dlp --version
