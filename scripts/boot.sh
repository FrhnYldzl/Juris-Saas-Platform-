#!/bin/sh
# Juris Platform — Railway/Docker boot script.
#   1) Apply pending Prisma migrations
#   2) Seed the DB (idempotent — seed.ts exits early if admin exists)
#   3) Start the Next.js server

set -e

echo "→ prisma migrate deploy"
./node_modules/.bin/prisma migrate deploy

if [ "${SEED_ON_BOOT:-true}" = "true" ]; then
  echo "→ seeding (idempotent)"
  node prisma/seed.compiled.cjs || echo "   seed step failed — continuing boot"
fi

echo "→ starting Next.js server on :${PORT:-3000}"
exec ./node_modules/.bin/next start -p "${PORT:-3000}" -H "${HOSTNAME:-0.0.0.0}"
