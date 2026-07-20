/**
 * Shared helpers for @llanesleonardo/create-saas.
 * HISTORY: CLI used to live only in bin/create-saas.mjs; High/Medium Epic 13
 * features (wizard, stubs, CI, template flags) split helpers here.
 */
import fs from "fs";
import path from "path";
import readline from "readline";

export function die(msg) {
  console.error(`create-saas: ${msg}`);
  process.exit(1);
}

export function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

export function write(file, content) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, content, "utf8");
}

export function slugify(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function titleCase(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function ensurePrefix(prefix, label = "--prefix") {
  const p = String(prefix).trim();
  if (!/^[a-z][a-z0-9_]*_$/i.test(p)) {
    die(`${label} must look like "acme_" (letters/numbers/underscore, end with _)`);
  }
  return p.toLowerCase();
}

export function parseArgs(argv) {
  const out = {
    name: null,
    prefix: null,
    cookiePrefix: null,
    apiKeyPrefix: null,
    productName: null,
    port: 3000,
    db: "sqlite",
    dir: null,
    deploy: true,
    withStripe: true,
    withClerk: false,
    entity: null,
    wizard: false,
    rebrand: false,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === "--name") out.name = next();
    else if (a === "--prefix" || a === "--cookie-prefix") {
      const v = next();
      out.prefix = v;
      out.cookiePrefix = v;
    } else if (a === "--api-key-prefix") out.apiKeyPrefix = next();
    else if (a === "--product-name") out.productName = next();
    else if (a === "--port") out.port = Number(next());
    else if (a === "--db") out.db = next();
    else if (a === "--dir" || a === "--out") out.dir = next();
    else if (a === "--entity") out.entity = next();
    else if (a === "--with-deploy") out.deploy = true;
    else if (a === "--no-deploy") out.deploy = false;
    else if (a === "--with-stripe") out.withStripe = true;
    else if (a === "--no-stripe") out.withStripe = false;
    else if (a === "--with-clerk") out.withClerk = true;
    else if (a === "--no-clerk") out.withClerk = false;
    else if (a === "--wizard") out.wizard = true;
    else if (a === "--rebrand") out.rebrand = true;
    else if (a === "--help" || a === "-h") out.help = true;
  }
  return out;
}

export function usage() {
  console.log(`Usage:
  npx @llanesleonardo/create-saas --name <slug> --prefix <cookie_api_prefix_>
  npx @llanesleonardo/create-saas --wizard

Options:
  --product-name "Display Name"   default: title-cased --name
  --cookie-prefix / --prefix      session/workspace cookie prefix (acme_)
  --api-key-prefix                defaults to cookie prefix
  --dir <path>                    default: ./<slug>
  --port 3000
  --db sqlite|memory|postgres     default: sqlite
  --entity contacts               domain stub (SQL + list page + API)
  --with-stripe / --no-stripe     Stripe kit (default: with)
  --with-clerk / --no-clerk       Clerk IdP stub (default: without)
  --with-deploy / --no-deploy     Docker + multi-cloud stubs (default: with)
  --wizard                        interactive brand/env prompts
  --rebrand                       update brand fields in an existing --dir app

Also:
  npx @llanesleonardo/create-saas add-domain --entity contacts --dir ./my-app
  npx @llanesleonardo/create-saas update-pins --dir ./my-app --shell 0.2.5 --platform 0.3.0
  npx @llanesleonardo/create-saas sync-docs --dir ./my-app

Docs scaffold: docs/Components · docs/Development · docs/Software Patterns Docs (sync patterns from @llanesleonardo/software-patterns-docs).

Requires NODE_AUTH_TOKEN (GitHub PAT with read:packages) for npm install afterward.
`);
}

export async function ask(question, defaultValue = "") {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const hint = defaultValue ? ` [${defaultValue}]` : "";
  const answer = await new Promise((resolve) => {
    rl.question(`${question}${hint}: `, resolve);
  });
  rl.close();
  const trimmed = String(answer ?? "").trim();
  return trimmed || defaultValue;
}

export async function runWizard(partial = {}) {
  console.log("\ncreate-saas brand wizard (Epic 13 / phase 80)\n");
  const name = partial.name || (await ask("Product slug (folder name)", "acme-crm"));
  const productName =
    partial.productName || (await ask("Display name", titleCase(slugify(name))));
  const cookiePrefix =
    partial.cookiePrefix ||
    partial.prefix ||
    (await ask("Cookie prefix (must end with _)", `${slugify(name).replace(/-/g, "")}_`));
  const apiKeyPrefix =
    partial.apiKeyPrefix || (await ask("API key prefix", cookiePrefix));
  const port = partial.port || Number(await ask("Dev port", "3000")) || 3000;
  const dbRaw = partial.db || (await ask("Database (sqlite|memory|postgres)", "sqlite"));
  const withStripe =
    partial.withStripe !== undefined
      ? partial.withStripe
      : /^(y|yes|1)$/i.test(await ask("Include Stripe kit? (Y/n)", "Y"));
  const withClerk =
    partial.withClerk !== undefined
      ? partial.withClerk
      : /^(y|yes|1)$/i.test(await ask("Include Clerk IdP stub? (y/N)", "N"));
  const entity =
    partial.entity || (await ask("Optional domain entity stub (e.g. contacts)", ""));

  return {
    ...partial,
    name,
    productName,
    prefix: cookiePrefix,
    cookiePrefix,
    apiKeyPrefix,
    port,
    db: dbRaw,
    withStripe: Boolean(withStripe),
    withClerk: Boolean(withClerk),
    entity: entity || null,
    wizard: true,
  };
}

export function normalizeDb(db) {
  const v = String(db || "sqlite").toLowerCase();
  if (!["sqlite", "memory", "postgres"].includes(v)) {
    die(`--db must be sqlite|memory|postgres (got ${db})`);
  }
  return v;
}

/** PascalCase / camelCase / kebab helpers for entity stubs */
export function entityNames(raw) {
  const kebab = slugify(raw);
  if (!kebab) die("invalid --entity");
  const pascal = kebab
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
  const camel = pascal.charAt(0).toLowerCase() + pascal.slice(1);
  const table = kebab.replace(/-/g, "_");
  return { kebab, pascal, camel, table };
}
