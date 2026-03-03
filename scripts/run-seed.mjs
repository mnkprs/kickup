#!/usr/bin/env node
/**
 * Seed dummy data for a tournament.
 *
 * Usage:
 *   TOURNAMENT_ID=your-uuid node scripts/run-seed.mjs
 *   npm run seed:tournament -- YOUR-TOURNAMENT-ID
 *
 * Prerequisites: seed.sql, migration 20260302000023
 */
import pg from "pg";

async function main() {
  const tournamentId =
    process.env.TOURNAMENT_ID ||
    process.argv[2];
  if (!tournamentId) {
    console.error("Usage: TOURNAMENT_ID=uuid node scripts/run-seed.mjs");
    console.error("   or: node scripts/run-seed.mjs <tournament-uuid>");
    process.exit(1);
  }

  const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("Missing POSTGRES_URL or DATABASE_URL in .env.local");
    process.exit(1);
  }

  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  try {
    console.log(`Seeding tournament ${tournamentId}...`);
    await client.query("SELECT seed_tournament_dummy_data($1::uuid)", [tournamentId]);
    console.log("Done.");
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
