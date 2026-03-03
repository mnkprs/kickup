#!/usr/bin/env node
/* eslint-env node */
/**
 * Wipe all app data from Supabase cloud (preserve users).
 * Deletes teams, matches, tournaments, notifications, etc.
 * Keeps auth.users and profiles intact.
 *
 * Usage:
 *   npm run db:wipe-cloud
 *
 * Prerequisites:
 *   - POSTGRES_URL or DATABASE_URL in .env.local
 *   - Get from Supabase Dashboard → Settings → Database → Connection string (URI)
 */
import pg from "pg";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SUPABASE = join(ROOT, "supabase");

function loadEnvLocal() {
  const path = join(ROOT, ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

async function main() {
  loadEnvLocal();
  const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("Missing POSTGRES_URL or DATABASE_URL. Set in .env.local or env.");
    console.error("Get from Supabase Dashboard → Settings → Database → Connection string");
    process.exit(1);
  }

  const isCloud = dbUrl.includes("supabase.com") || dbUrl.includes("pooler");
  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: isCloud ? { rejectUnauthorized: false } : false,
  });
  await client.connect();

  try {
    console.log("→ Wiping app data (preserving auth.users and profiles)...");
    const wipeSql = readFileSync(join(SUPABASE, "scripts", "wipe_app_data.sql"), "utf8");
    await client.query(wipeSql);
    console.log("✓ Done. All app data removed. Users preserved.");
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
