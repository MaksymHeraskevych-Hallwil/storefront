FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

# Дев-режим: Next.js dev server із hot-reload (код монтується з хоста
# через volume у docker-compose.yml). Production-білд (next build +
# next start) — Етап 8, разом з бекендом.
CMD ["npm", "run", "dev"]
