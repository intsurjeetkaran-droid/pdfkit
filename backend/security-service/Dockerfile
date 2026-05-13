FROM node:20-alpine

# qpdf — command-line PDF password protection/removal tool
RUN apk add --no-cache qpdf

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

RUN mkdir -p src/uploads outputs logs

EXPOSE 3008

CMD ["node", "dist/server.js"]
