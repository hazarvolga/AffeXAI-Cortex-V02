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
RUN pnpm install --frozen-lockfile --filter nextn...
COPY apps/frontend ./apps/frontend
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SOCKET_URL
ARG NEXT_PUBLIC_APP_URL
ARG BACKEND_URL=http://backend:9006
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} NEXT_PUBLIC_SOCKET_URL=${NEXT_PUBLIC_SOCKET_URL} NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL} BACKEND_URL=${BACKEND_URL}
ENV NEXT_TELEMETRY_DISABLED=1 NODE_OPTIONS=--max-old-space-size=4096
RUN pnpm --filter nextn build

FROM node:24.18.0-bookworm-slim AS production
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
COPY --from=builder --chown=node:node /app/apps/frontend/.next/standalone ./
COPY --from=builder --chown=node:node /app/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=builder --chown=node:node /app/apps/frontend/public ./apps/frontend/public
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "apps/frontend/server.js"]
