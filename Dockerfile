# syntax=docker/dockerfile:1.7
# =====================================================================
# Juris Platform — Production Dockerfile
# Multi-stage build for Railway. Full node_modules at runtime so
# `prisma migrate deploy` has its transitive deps (e.g. 'effect').
# =====================================================================

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ----- Dependencies (full tree, prod only) -----
FROM base AS deps
COPY package.json package-lock.json* ./
COPY prisma ./prisma
# Install production deps only, no scripts (postinstall fires later).
RUN npm ci --omit=dev --ignore-scripts && npx prisma generate

# ----- Build (needs dev deps for next build) -----
FROM base AS builder
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci --ignore-scripts
COPY . .
RUN npx prisma generate && npm run build

# Compile seed.ts → seed.compiled.cjs (so runtime doesn't need tsx)
RUN npx esbuild prisma/seed.ts \
    --bundle --platform=node --target=node22 \
    --outfile=prisma/seed.compiled.cjs \
    --external:@prisma/client --external:bcryptjs --external:.prisma

# ----- Runtime -----
FROM base AS runner
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Production-only node_modules (full transitive tree — Prisma CLI works)
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Built app
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma/seed.compiled.cjs ./prisma/seed.compiled.cjs
COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts ./next.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json ./tsconfig.json

# Boot script (migrate + seed + start)
COPY --chown=nextjs:nodejs scripts/boot.sh ./boot.sh
RUN chmod +x ./boot.sh

USER nextjs
EXPOSE 3000
ENV PORT=3000
# HOSTNAME is intentionally not set — Railway injects its own (internal
# service name) which would confuse `next start -H`. boot.sh hardcodes
# 0.0.0.0 to guarantee we bind to all interfaces.

CMD ["./boot.sh"]
