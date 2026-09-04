FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5051

# Дев-режим: nodemon перезапускає сервер при зміні файлів
# (код монтується з хоста через volume у docker-compose.yml).
# Окремий, production-орієнтований Dockerfile (npm run build + npm start,
# без volume) з'явиться на Етапі 8, коли дійде до деплою.
CMD ["npm", "run", "dev"]
