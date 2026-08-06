FROM node:20-slim

# Installation des dépendances natives légères (utiles pour sharp, canvas, etc.)
RUN apt-get update && apt-get install -y \
    libvips-dev \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copier les fichiers de dépendances en premier (meilleure mise en cache)
COPY package*.json ./
RUN npm install

# Copier le reste du code source (template, public, server.js, index.js, etc.)
COPY . .

# Le port peut être redéfini par la variable d'environnement (Render, etc.)
ENV PORT=10000
EXPOSE 10000

# Lancer le bot
CMD ["npm", "start"]
