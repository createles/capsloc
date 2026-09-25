# ==============================================================================
# STAGE 1: Base Alpine image with Node.js 22 & pnpm v11
# ==============================================================================
FROM node:22-alpine AS base
ENV PNPM_HOME="/home/node/.local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV CI=true
RUN npm install -g pnpm@11.24.0

# ==============================================================================
# STAGE 2: Monorepo Build & Dependency Pruning
# ==============================================================================
FROM base AS builder
WORKDIR /app

# Copy root configurations & workspace manifests
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/types/package.json ./packages/types/
COPY apps/server/package.json ./apps/server/
COPY apps/client/package.json ./apps/client/

# Install all dependencies (including devDependencies required for compilation)
RUN pnpm install --frozen-lockfile

# Copy full monorepo source trees
COPY packages/types ./packages/types
COPY apps/server ./apps/server
COPY apps/client ./apps/client

# Build shared types first, followed by backend server and client SPA
RUN pnpm --filter @capsloc/types run build
RUN pnpm --filter @capsloc/server run build
RUN pnpm --filter @capsloc/client run build

# Prune devDependencies to keep runtime container ultra-lean
WORKDIR /app
RUN pnpm prune --prod

# ==============================================================================
# STAGE 3: Production Client Runner (Nginx SPA & Reverse Proxy for Docker Compose)
# ==============================================================================
FROM nginx:alpine AS client-runner
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/client/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# ==============================================================================
# STAGE 4: Production Unified Server Runner (NestJS API, Sockets & SPA)
# ==============================================================================
FROM base AS server-runner
WORKDIR /app
ENV NODE_ENV=production

# Copy root workspace manifests
COPY --chown=node:node --from=builder /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./

# Copy compiled artifacts, schema, client SPA dist, and pruned production dependencies
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/packages/types ./packages/types
COPY --chown=node:node --from=builder /app/apps/server/dist ./apps/server/dist
COPY --chown=node:node --from=builder /app/apps/server/node_modules ./apps/server/node_modules
COPY --chown=node:node --from=builder /app/apps/server/package.json ./apps/server/package.json
COPY --chown=node:node --from=builder /app/apps/server/prisma ./apps/server/prisma
COPY --chown=node:node --from=builder /app/apps/server/prisma.config.ts ./apps/server/prisma.config.ts
COPY --chown=node:node --from=builder /app/apps/server/src/generated ./apps/server/src/generated
COPY --chown=node:node --from=builder /app/apps/server/docker-start.sh ./apps/server/docker-start.sh
COPY --chown=node:node --from=builder /app/apps/client/dist /app/apps/client/dist

# Ensure the non-privileged node user owns /app and all contents
RUN chown -R node:node /app && chmod +x /app/apps/server/docker-start.sh

# Run as non-privileged system user for container security hardening
USER node

WORKDIR /app/apps/server
EXPOSE 3000
CMD ["./docker-start.sh"]
