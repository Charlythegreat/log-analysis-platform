# ─── Stage 1: Build ───
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
COPY backend/package.json backend/
RUN npm ci --workspace=backend

COPY backend/ backend/
RUN npm run build:backend

# ─── Stage 2: Production ───
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3001
CMD ["node", "dist/main"]
