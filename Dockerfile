FROM node:20-slim

# Installer Python, pip, ffmpeg + yt-dlp + deno
RUN apt-get update && apt-get install -y \
    python3 python3-pip python3-venv \
    ffmpeg \
    curl unzip \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# yt-dlp via pip
RUN pip3 install --no-cache-dir --break-system-packages yt-dlp

# Deno (runtime JS pour YouTube)
RUN curl -fsSL https://deno.land/install.sh | DENO_INSTALL=/usr/local sh \
    && ln -s /usr/local/bin/deno /usr/bin/deno || true

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY requirements.txt ./
RUN pip3 install --no-cache-dir --break-system-packages -r requirements.txt || true

COPY . .

ENV PORT=10000
EXPOSE 10000

CMD ["node", "start-all.js"]
