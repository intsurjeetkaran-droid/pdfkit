FROM node:20-alpine

# poppler-utils — pdftoppm for page preview generation
RUN apk add --no-cache poppler-utils

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

RUN mkdir -p src/uploads outputs logs

EXPOSE 3009

CMD ["node", "dist/server.js"]
