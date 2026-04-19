#!/bin/sh
# Juris Platform — Railway/Docker boot script.
#   1) Apply pending Prisma migrations
#   2) Seed the DB (idempotent — seed.ts exits early if admin exists)
#   3) Start the Next.js standalone server

set -e

echo "→ prisma migrate deploy"
node node_modules/prisma/build/index.js migrate deploy

if [ "${SEED_ON_BOOT:-true}" = "true" ]; then
  echo "→ seeding (idempotent)"
  node prisma/seed.compiled.cjs || echo "   seed step failed — continuing boot"
fi

echo "→ starting Next.js server on :${PORT:-3000}"
exec node server.js
