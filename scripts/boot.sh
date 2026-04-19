#!/bin/sh
# Juris Platform — Railway/Docker boot script.
#   0) Pre-flight: required env vars
#   1) Apply pending Prisma migrations
#   2) Seed the DB (idempotent — seed.ts exits early if admin exists)
#   3) Start the Next.js server

set -e

err() {
  echo ""
  echo "██████████████████████████████████████████████████████████████"
  echo "██  BOOT FAILED: $1"
  echo "██████████████████████████████████████████████████████████████"
  echo "$2"
  echo ""
  exit 1
}

# ---------- 0. Pre-flight ----------
echo "→ pre-flight: checking required environment variables"

if [ -z "$DATABASE_URL" ]; then
  err "DATABASE_URL is not set" \
"Railway'de web servisine aşağıdaki environment variable'ı ekleyin:

  DATABASE_URL = \${{Postgres.DATABASE_URL}}

Adımlar:
  1. Railway dashboard → projeniz → Juris-Saas-Platform- servisi
  2. Variables sekmesi → + New Variable
  3. Name: DATABASE_URL
     Value: \${{Postgres.DATABASE_URL}}     (aynen bu şekilde yazın, Railway
     otomatik Postgres plugin'in URL'siyle değiştirir)
  4. Save → servis yeniden başlayacak

Postgres plugin eklenmemiş olabilir. Projede + New → Database → PostgreSQL
ile ekleyin."
fi

if [ -z "$AUTH_SECRET" ]; then
  err "AUTH_SECRET is not set" \
"Railway'de:
  1. Terminal'de: openssl rand -base64 32
  2. Çıktıyı AUTH_SECRET variable'ına ekleyin
  3. AUTH_URL = https://<railway-verdiği-public-domain>
  4. NEXT_PUBLIC_APP_URL = AUTH_URL ile aynı"
fi

echo "  ✓ DATABASE_URL set"
echo "  ✓ AUTH_SECRET set"

# ---------- 1. Migrations ----------
echo "→ prisma migrate deploy"
./node_modules/.bin/prisma migrate deploy

# ---------- 2. Seed ----------
if [ "${SEED_ON_BOOT:-true}" = "true" ]; then
  echo "→ seeding (idempotent — skipped if admin already exists)"
  node prisma/seed.compiled.cjs || echo "   seed step failed — continuing boot"
fi

# ---------- 3. Start Next.js ----------
# IMPORTANT: Railway sets HOSTNAME to an internal service name (not an IP),
# which breaks `next start -H $HOSTNAME` — we hardcode 0.0.0.0 so the
# container actually listens on all interfaces and the Railway proxy can
# reach it.
PORT_TO_USE="${PORT:-3000}"
echo "→ starting Next.js server on 0.0.0.0:${PORT_TO_USE}"
exec ./node_modules/.bin/next start -p "${PORT_TO_USE}" -H 0.0.0.0
