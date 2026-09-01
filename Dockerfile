# Пиним минорную версию: :22 плавает и ломает воспроизводимость сборки.
FROM node:22.11-alpine

ENV NODE_ENV=production
WORKDIR /app

# Зависимостей нет — копируем только исходники сайта.
COPY package.json server.js ./
COPY public ./public
COPY scripts ./scripts

# node:alpine уже содержит непривилегированного пользователя `node`.
USER node

EXPOSE 8080
CMD ["node", "server.js"]
