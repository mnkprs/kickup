#!/usr/bin/env node
/* eslint-env node */
/**
 * Reset DB to fresh environment (preserve users).
 * Wipes app data and reseeds. Uses POSTGRES_URL or DATABASE_URL from .env.local.
 *
 * Usage:
 *   npm run db:reset-fresh
 *
 * Prerequisites:
 *   - POSTGRES_URL or DATABASE_URL in .env.local (Supabase Dashboard → Settings → Database)
 *   - Migrations applied: supabase db push
 */
import dns from "dns";
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

  const isCloud = dbUrl.includes("supabase.com") || dbUrl.includes("pooler") || !dbUrl.includes("127.0.0.1");
  if (isCloud) process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  // Resolve hostname to IPv4 to avoid ENETUNREACH when network lacks IPv6
  let connectionUrl = dbUrl;
  try {
    const url = new URL(dbUrl);
    if (url.hostname && url.hostname !== "localhost" && !/^\d+\.\d+\.\d+\.\d+$/.test(url.hostname)) {
      const { address } = await dns.promises.lookup(url.hostname, { family: 4 });
      url.hostname = address;
      connectionUrl = url.toString();
    }
  } catch {
    // Keep original URL if resolution fails
  }

  const client = new pg.Client({
    connectionString: connectionUrl,
    ssl: isCloud ? { rejectUnauthorized: false } : false,
  });
  await client.connect();

  try {
    console.log("→ Wiping app data (preserving users)...");
    const wipeSql = readFileSync(join(SUPABASE, "scripts", "wipe_app_data.sql"), "utf8");
    await client.query(wipeSql);

    console.log("→ Seeding fresh data...");
    const seedSql = readFileSync(join(SUPABASE, "seed.sql"), "utf8");
    const batches = seedSql
      .split(/(?=^-- ─── \d+\.)/m)
      .map((s) => s.trim())
      .filter(Boolean);
    for (let i = 0; i < batches.length; i++) {
      try {
        await client.query(batches[i]);
      } catch (err) {
        console.error(`Error in batch ${i + 1}/${batches.length}:`, err.message);
        throw err;
      }
    }

    console.log("✓ Done. Database reset to fresh environment. Users preserved.");
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
