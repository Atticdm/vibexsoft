# Pin the minor version: :22 floats and breaks build reproducibility.
FROM node:22.11-alpine

ENV NODE_ENV=production
WORKDIR /app

# There are no dependencies — copy only the site sources.
COPY package.json server.js ./
COPY public ./public
COPY scripts ./scripts

# node:alpine already ships an unprivileged `node` user.
USER node

EXPOSE 8080
CMD ["node", "server.js"]
