#!/usr/bin/env node
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("Missing POSTGRES_URL or DATABASE_URL");
    process.exit(1);
  }

  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const migrationPath = join(__dirname, "../supabase/migrations/20260302000021_advance_to_knockouts_empty_groups.sql");
  const seedPath = join(__dirname, "../supabase/scripts/seed_tournament_knockouts.sql");

  try {
    console.log("Running migration (fix advance_to_knockouts)...");
    const migration = readFileSync(migrationPath, "utf8");
    await client.query(migration);
    console.log("Migration OK");

    console.log("Running seed script...");
    const seed = readFileSync(seedPath, "utf8");
    await client.query(seed);
    console.log("Seed OK");
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
