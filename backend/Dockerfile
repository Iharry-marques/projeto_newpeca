FROM node:20-slim

# Dependências úteis (mantivemos mínimo; se usar Puppeteer nesta fase adicionamos libs depois)
RUN apt-get update && apt-get install -y \
    ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
ENV PORT=8080

CMD ["node", "app.js"]
