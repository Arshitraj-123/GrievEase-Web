# Syntax: docker/dockerfile:1
# ------------------------------------------------------------------------------
# Stage 1: Base & Dependencies Builder
# ------------------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm@9.15.4

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/ui/package.json ./packages/ui/

RUN pnpm install --frozen-lockfile

COPY packages/contracts ./packages/contracts
COPY packages/ui ./packages/ui
COPY apps/web ./apps/web
COPY tsconfig.json ./

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN pnpm --filter @grievease/contracts build || true
RUN pnpm --filter @grievease/web build

# ------------------------------------------------------------------------------
# Stage 2: Minimal Production Runner (Non-root user)
# ------------------------------------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache curl

# Security: Run as non-root standard user
USER node

COPY --chown=node:node --from=builder /app/package.json ./
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/packages ./packages
COPY --chown=node:node --from=builder /app/apps/web/public ./apps/web/public
COPY --chown=node:node --from=builder /app/apps/web/.next ./apps/web/.next
COPY --chown=node:node --from=builder /app/apps/web/package.json ./apps/web/package.json

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

CMD ["pnpm", "--filter", "@grievease/web", "start"]
