/**
 * Apply supabase/migrations/*.sql in filename order against the project database.
 *
 *   npm run migrate
 *
 * Needs SUPABASE_DB_URL in .env.local - the Postgres connection string from
 * Supabase → Project Settings → Database (use the "Session" pooler or direct
 * connection URI, including the password).
 *
 * Tracks applied migrations in a schema_migrations table, so re-running only
 * applies what's new. Each migration runs in its own transaction.
 */

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { Client } from "pg";

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");

async function main() {
  const url = process.env.SUPABASE_DB_URL;
  if (!url) throw new Error("SUPABASE_DB_URL is not set in .env.local");

  const files = (await readdir(MIGRATIONS_DIR))
    .filter((f) => f.endsWith(".sql"))
    .sort();

  // Supabase requires TLS; the pooler presents a chain Node doesn't bundle a root for.
  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(`
      create table if not exists schema_migrations (
        filename    text primary key,
        applied_at  timestamptz not null default now()
      );
    `);
    const { rows } = await client.query<{ filename: string }>(
      "select filename from schema_migrations",
    );
    const applied = new Set(rows.map((r) => r.filename));

    // Baseline: 0001 was applied to this project before schema_migrations existed.
    // If the core schema is already present, record it as applied rather than
    // re-running its non-idempotent `create type` / `create table` statements.
    if (applied.size === 0 && files.includes("0001_init.sql")) {
      const { rows: t } = await client.query(
        "select 1 from information_schema.tables where table_schema = 'public' and table_name = 'masjids'",
      );
      if (t.length > 0) {
        await client.query(
          "insert into schema_migrations (filename) values ('0001_init.sql') on conflict do nothing",
        );
        applied.add("0001_init.sql");
        console.log("· 0001_init.sql (baselined - core schema already present)");
      }
    }

    let ran = 0;
    for (const file of files) {
      if (applied.has(file)) {
        if (file !== "0001_init.sql") console.log(`· ${file} (already applied)`);
        continue;
      }
      const sql = await readFile(join(MIGRATIONS_DIR, file), "utf8");
      process.stdout.write(`▸ ${file} … `);
      await client.query("begin");
      try {
        await client.query(sql);
        await client.query("insert into schema_migrations (filename) values ($1)", [file]);
        await client.query("commit");
        console.log("done");
        ran += 1;
      } catch (err) {
        await client.query("rollback");
        throw new Error(`${file} failed: ${err instanceof Error ? err.message : err}`);
      }
    }
    console.log(ran === 0 ? "\nNothing to apply." : `\nApplied ${ran} migration(s).`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
