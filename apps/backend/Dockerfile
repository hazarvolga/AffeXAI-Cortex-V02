# syntax=docker/dockerfile:1
FROM node:24.18.0-bookworm-slim AS tooling
WORKDIR /app
RUN npm install --global pnpm@11.17.0
ENV PUPPETEER_SKIP_DOWNLOAD=true
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/shared-types ./packages/shared-types

FROM tooling AS shared
RUN pnpm install --frozen-lockfile --filter @affexai/shared-types
RUN pnpm --filter @affexai/shared-types build

FROM shared AS builder
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
RUN pnpm install --frozen-lockfile --filter affexai-backend...
COPY apps/backend ./apps/backend
RUN NODE_OPTIONS=--max-old-space-size=4096 pnpm --filter affexai-backend build

FROM tooling AS production-dependencies
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY --from=shared /app/packages/shared-types/dist ./packages/shared-types/dist
RUN pnpm install --frozen-lockfile --prod --filter affexai-backend...

FROM node:24.18.0-bookworm-slim AS production
RUN apt-get update && apt-get install -y --no-install-recommends chromium postgresql-client ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production PORT=9006 PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
COPY --from=production-dependencies /app/node_modules ./node_modules
COPY --from=production-dependencies /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/packages/shared-types ./packages/shared-types
COPY apps/backend/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh && mkdir -p /app/uploads /app/apps/backend/uploads /app/backups /app/temp /app/quarantine && chown node:node /app/uploads /app/apps/backend/uploads /app/backups /app/temp /app/quarantine
USER node
EXPOSE 9006
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||9006)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "apps/backend/dist/main.js"]
