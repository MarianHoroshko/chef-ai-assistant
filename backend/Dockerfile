# --- Production Dockerfile ---
FROM node:20-bookworm

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/server.js"]
