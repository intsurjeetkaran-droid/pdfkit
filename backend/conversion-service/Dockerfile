FROM node:20-alpine

# Install LibreOffice, poppler-utils (pdftoppm), and Ghostscript
RUN apk add --no-cache \
    libreoffice \
    poppler-utils \
    ghostscript \
    ttf-freefont \
    font-noto

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

RUN mkdir -p uploads outputs logs

EXPOSE 3002

CMD ["node", "dist/server.js"]
