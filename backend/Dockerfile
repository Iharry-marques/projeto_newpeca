FROM node:20-slim

# Dependências úteis (mantivemos mínimo; se usar Puppeteer nesta fase adicionamos libs depois)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --include=dev \
    && npm prune --production

COPY . .

# ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "app.js"]
