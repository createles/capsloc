# ==============================================================================
# STAGE 1: Base Alpine image with Node.js 22 & pnpm v11
# ==============================================================================
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@11.24.0 --activate

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

# Generate Prisma 7 Client bindings in the server
WORKDIR /app/apps/server
RUN pnpm exec prisma generate

# Prune devDependencies to keep runtime container ultra-lean
WORKDIR /app
RUN pnpm prune --prod

# ==============================================================================
# STAGE 3: Production Server Runner (NestJS API & WebSocket Gateway)
# ==============================================================================
FROM node:22-alpine AS server-runner
WORKDIR /app
ENV NODE_ENV=production

# Run as non-privileged system user for container security hardening
USER node

# Copy compiled artifacts, schema, and pruned production dependencies
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/packages/types ./packages/types
COPY --chown=node:node --from=builder /app/apps/server/dist ./apps/server/dist
COPY --chown=node:node --from=builder /app/apps/server/node_modules ./apps/server/node_modules
COPY --chown=node:node --from=builder /app/apps/server/package.json ./apps/server/package.json
COPY --chown=node:node --from=builder /app/apps/server/prisma ./apps/server/prisma
COPY --chown=node:node --from=builder /app/apps/server/src/generated ./apps/server/src/generated

WORKDIR /app/apps/server
EXPOSE 3000
CMD ["node", "dist/main.js"]

# ==============================================================================
# STAGE 4: Production Client Runner (Nginx SPA & Reverse Proxy)
# ==============================================================================
FROM nginx:alpine AS client-runner
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/client/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
