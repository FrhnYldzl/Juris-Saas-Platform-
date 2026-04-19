# syntax=docker/dockerfile:1.7
# =====================================================================
# Juris Platform — Production Dockerfile
# Multi-stage build, optimized for Railway
# =====================================================================

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# boot script copied directly at runner stage (no compile needed)

# ----- Dependencies -----
FROM base AS deps
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci --ignore-scripts

# ----- Build -----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Pre-compile the seed script to a single CJS file so the runtime image
# doesn't need tsx + transitive deps. @prisma/client, bcryptjs stay external.
RUN npx esbuild prisma/seed.ts \
    --bundle --platform=node --target=node22 \
    --outfile=prisma/seed.compiled.cjs \
    --external:@prisma/client --external:bcryptjs --external:.prisma

# ----- Runtime -----
FROM base AS runner
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Prisma: generated client (.prisma), runtime packages (@prisma/*) and CLI for migrate deploy
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma

# Seeding: pre-compiled cjs bundle + bcryptjs runtime dep
COPY --from=builder --chown=nextjs:nodejs /app/prisma/seed.compiled.cjs ./prisma/seed.compiled.cjs
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/bcryptjs ./node_modules/bcryptjs

COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --chown=nextjs:nodejs scripts/boot.sh ./boot.sh
RUN chmod +x ./boot.sh

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# boot.sh: run migrations, seed on first boot, then start the server.
CMD ["./boot.sh"]
