/**
 * Idempotent PostgreSQL migration runner (scaffolded by create-saas).
 *
 * Order:
 * 1. schema_migrations table
 * 2. Optional product baseline: src/domain/migrations/postgres.sql
 * 3. Platform SQL under node_modules/@llanesleonardo/saas-platform/migrations
 * 4. Product versioned SQL under src/domain/migrations/versions/*.sql
 *
 * Usage:
 *   DATABASE_URL=postgresql://... npm run db:migrate
 *
 * Exits 0 when DATABASE_URL is unset and DATABASE_PROVIDER is sqlite|memory
 * so local Docker/SQLite scaffolds do not fail.
 */
import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const require = createRequire(import.meta.url);

function productMigrationsRoot() {
  return path.join(root, "src", "domain", "migrations");
}

function platformMigrationsRoot() {
  const nested = path.join(
    root,
    "node_modules",
    "@llanesleonardo",
    "saas-platform",
    "migrations",
  );
  if (fs.existsSync(nested)) return nested;
  // Monorepo hoist fallback
  const hoisted = path.join(
    root,
    "..",
    "..",
    "node_modules",
    "@llanesleonardo",
    "saas-platform",
    "migrations",
  );
  return hoisted;
}

async function ensureMigrationsTable(client) {
  await client.query(`
    create table if not exists schema_migrations (
      id text primary key,
      applied_at timestamptz not null default now()
    )
  `);
}

async function appliedSet(client) {
  const res = await client.query(`select id from schema_migrations`);
  return new Set(res.rows.map((r) => r.id));
}

async function applySql(client, id, sql, already) {
  if (already.has(id)) {
    console.log(`skip ${id} (already applied)`);
    return;
  }
  console.log(`apply ${id}`);
  await client.query("begin");
  try {
    await client.query(sql);
    await client.query(`insert into schema_migrations (id) values ($1)`, [id]);
    await client.query("commit");
    already.add(id);
  } catch (err) {
    await client.query("rollback");
    throw err;
  }
}

async function applyVersionDir(client, dir, already, label) {
  if (!fs.existsSync(dir)) {
    console.log(`skip ${label} (missing ${dir})`);
    return;
  }
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const file of files) {
    const id = file.replace(/\.sql$/i, "");
    const sql = fs.readFileSync(path.join(dir, file), "utf8");
    await applySql(client, id, sql, already);
  }
}

async function main() {
  const provider = (process.env.DATABASE_PROVIDER ?? "sqlite").trim().toLowerCase();
  const url = process.env.DATABASE_URL?.trim();

  if (!url) {
    if (provider === "sqlite" || provider === "memory") {
      console.log(
        `[migrate-postgres] skip — DATABASE_PROVIDER=${provider} (no DATABASE_URL)`,
      );
      process.exit(0);
    }
    console.error("DATABASE_URL is required for Postgres migrations");
    process.exit(1);
  }

  let pg;
  try {
    pg = require("pg");
  } catch {
    console.error(
      "migrate-postgres: install `pg` (npm i pg) when using PostgreSQL migrations",
    );
    process.exit(1);
  }

  const { Client } = pg;
  const client = new Client({
    connectionString: url,
    ssl: process.env.DATABASE_SSL === "0" ? undefined : { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    await ensureMigrationsTable(client);
    const already = await appliedSet(client);

    const baselinePath = path.join(productMigrationsRoot(), "postgres.sql");
    if (fs.existsSync(baselinePath)) {
      const baselineSql = fs.readFileSync(baselinePath, "utf8");
      console.log("apply postgres.sql (idempotent product baseline DDL)");
      await client.query(baselineSql);
      if (!already.has("000_postgres_baseline")) {
        await client.query(`insert into schema_migrations (id) values ($1)`, [
          "000_postgres_baseline",
        ]);
        already.add("000_postgres_baseline");
      }
    } else {
      console.log("skip product baseline (no src/domain/migrations/postgres.sql)");
    }

    await applyVersionDir(client, platformMigrationsRoot(), already, "platform migrations");
    await applyVersionDir(
      client,
      path.join(productMigrationsRoot(), "versions"),
      already,
      "product migrations",
    );

    console.log("migrations complete");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("migration failed:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
