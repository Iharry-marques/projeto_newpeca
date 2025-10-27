FROM node:20-slim

 # Instala ffmpeg e libvips (dependência do sharp)
 RUN apt-get update && apt-get install -y --no-install-recommends \
     ffmpeg \
     libvips-dev \
     ca-certificates \
  && rm -rf /var/lib/apt/lists/*

 WORKDIR /usr/src/app

 COPY package*.json ./
 # Instala dependências normais E as devDependencies que podem ser necessárias
 # para compilar o sharp corretamente durante o `npm ci`
 RUN npm ci --include=dev

 # Remove devDependencies após a instalação para manter a imagem menor
 RUN npm prune --production

 COPY . .

 ENV NODE_ENV=production
 ENV PORT=10000

 CMD ["node", "app.js"]