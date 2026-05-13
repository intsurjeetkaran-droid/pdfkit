FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

RUN mkdir -p src/uploads outputs logs

EXPOSE 3007

CMD ["node", "dist/server.js"]
