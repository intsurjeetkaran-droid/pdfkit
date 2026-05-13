FROM node:20-alpine

# OpenSSL required by Prisma client
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Generate Prisma client from the service-local schema
RUN npx prisma generate --schema=./prisma/schema.prisma

RUN npm run build

# Create storage directories (mapped to Docker volumes)
RUN mkdir -p storage/temp storage/processed storage/cache logs

EXPOSE 3003

CMD ["node", "dist/server.js"]
