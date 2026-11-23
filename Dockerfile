FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies required by Prisma / native binaries
RUN apk add --no-cache openssl libc6-compat

# Install npm dependencies
COPY package*.json ./
RUN npm ci

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy the rest of the application code
COPY . .

# Ensure upload directory exists
RUN mkdir -p public/uploads

# Configure startup entrypoint
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production

ENTRYPOINT ["./docker-entrypoint.sh"]
