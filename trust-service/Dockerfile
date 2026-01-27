# Trust Service Dockerfile
# Multi-stage build for API and Worker targets

# ========================
# Base stage
# ========================
FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# ========================
# Build stage
# ========================
FROM node:20-alpine AS build

WORKDIR /app

# Install all dependencies (including dev)
COPY package*.json ./
RUN npm ci

# Copy source and compile TypeScript
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ========================
# API target
# ========================
FROM base AS api

# Copy compiled code
COPY --from=build /app/dist ./dist

# Expose API port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3002/health || exit 1

# Start API server
CMD ["node", "dist/api/server.js"]

# ========================
# Worker target
# ========================
FROM base AS worker

# Copy compiled code
COPY --from=build /app/dist ./dist

# No port exposure needed for worker

# Start worker
CMD ["node", "dist/worker/index.js"]
