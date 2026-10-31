# Syntax: docker/dockerfile:1
# ------------------------------------------------------------------------------
# Stage 1: Base & Dependencies Builder
# ------------------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm and native compilation dependencies for argon2
RUN apk add --no-cache python3 make g++ libc6-compat
RUN npm install -g pnpm@9.15.4

# Copy monorepo manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/ui/package.json ./packages/ui/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY packages/contracts ./packages/contracts
COPY packages/ui ./packages/ui
COPY apps/api ./apps/api
COPY tsconfig.json ./

# Build packages and API
RUN pnpm --filter @grievease/contracts build || true
RUN pnpm --filter @grievease/api build

# ------------------------------------------------------------------------------
# Stage 2: Minimal Production Runner (Non-root user)
# ------------------------------------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Install curl for container health check
RUN apk add --no-cache curl

# Security: Run as non-root standard user
USER node

# Copy build artifacts and production modules
COPY --chown=node:node --from=builder /app/package.json ./
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/packages ./packages
COPY --chown=node:node --from=builder /app/apps/api/dist ./apps/api/dist
COPY --chown=node:node --from=builder /app/apps/api/package.json ./apps/api/package.json

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:4000/api/v1/health || exit 1

CMD ["node", "apps/api/dist/main.js"]
