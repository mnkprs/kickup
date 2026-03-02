#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
#  KICKUP — Reset DB to Fresh Environment (Preserve Users)
#  Wipes all app data (teams, matches, tournaments, etc.) and reseeds.
#  Keeps auth.users and profiles intact.
#
#  Local:  npm run db:reset-fresh
#  Cloud:  DB_URL="postgresql://postgres.[ref]:[pwd]@aws-0-[region].pooler.supabase.com:6543/postgres" npm run db:reset-fresh
#          (Get URL from Supabase Dashboard → Settings → Database)
# ═══════════════════════════════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SUPABASE_DIR="$PROJECT_ROOT/supabase"

# DB_URL: local default, or set for cloud (from .env.local, Dashboard, etc.)
DB_URL="${DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
IS_CLOUD=false
[[ "$DB_URL" == *"supabase.com"* || "$DB_URL" == *"pooler"* ]] && IS_CLOUD=true

cd "$PROJECT_ROOT"

if [[ "$IS_CLOUD" == false ]]; then
  echo "→ Ensuring Supabase is running..."
  if ! supabase status &>/dev/null; then
    echo "  Starting Supabase..."
    supabase start
  fi
fi

echo "→ Wiping app data (preserving users)..."
psql "$DB_URL" -f "$SUPABASE_DIR/scripts/wipe_app_data.sql"

echo "→ Seeding fresh data..."
psql "$DB_URL" -f "$SUPABASE_DIR/seed.sql"

echo "✓ Done. Database reset to fresh environment. Users preserved."
