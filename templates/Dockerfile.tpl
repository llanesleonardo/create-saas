# __APP_NAME__ — production image (scaffolded)
#
# Shared web (+ optional worker) image. Override CMD:
#   web:    node server.js
#   worker: node worker.js
#
# Build (standalone product root = this folder):
#   docker build -t __APP_SLUG__:local .
#
# Build (monorepo app under apps/__APP_SLUG__ — run from monorepo root):
#   docker build -f apps/__APP_SLUG__/Dockerfile -t __APP_SLUG__:local .

FROM node:20.19.0-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:20.19.0-bookworm-slim AS builder
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_APP_URL=http://localhost:__APP_PORT__
RUN npm run build
# Bundle outbox worker next to standalone server (optional; safe if unused).
RUN npm run build:worker \
  && mkdir -p .next/standalone \
  && cp dist/worker.js .next/standalone/worker.js 2>/dev/null || true
RUN mkdir -p .next/standalone \
  && if [ -f .next/standalone/server.js ]; then \
       cp -r .next/static .next/standalone/.next/static 2>/dev/null || true; \
       cp -r public .next/standalone/public 2>/dev/null || true; \
     elif [ -f .next/standalone/apps/__APP_SLUG__/server.js ]; then \
       echo "Monorepo nested standalone detected"; \
     else \
       echo "WARN: standalone server.js not found — enable output:'standalone' in next.config.ts"; \
     fi
# Ship migrate script + domain SQL for PRE_DEPLOY hooks.
RUN mkdir -p .next/standalone/scripts .next/standalone/src/domain/migrations \
  && cp scripts/migrate-postgres.mjs .next/standalone/scripts/ 2>/dev/null || true \
  && cp -r src/domain/migrations/. .next/standalone/src/domain/migrations/ 2>/dev/null || true

FROM node:20.19.0-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=__APP_PORT__
ENV HOSTNAME=0.0.0.0

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

RUN mkdir -p /app/data /app/logs \
  && chown -R nextjs:nodejs /app/data /app/logs

USER nextjs
EXPOSE __APP_PORT__
CMD ["node", "server.js"]
