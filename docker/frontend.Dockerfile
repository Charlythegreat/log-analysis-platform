# ─── Stage 1: Build ───
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
COPY frontend/package.json frontend/
RUN npm ci --workspace=frontend

COPY frontend/ frontend/
RUN npm run build:frontend

# ─── Stage 2: Production ───
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/frontend/.next/standalone ./
COPY --from=builder /app/frontend/.next/static ./.next/static
COPY --from=builder /app/frontend/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
