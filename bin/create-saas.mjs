#!/usr/bin/env node
/**
 * @llanesleonardo/create-saas
 *
 * Scaffold a new SaaS app on chassis + product shell — independent of PeopleForms.
 *
 *   npx @llanesleonardo/create-saas --name acme-crm --prefix acme_
 *   npm create @llanesleonardo/saas -- --name acme --prefix acme_   # after publish
 *
 * Creates a standalone Next.js app in ./<name> (or --dir). Pins published packages
 * from GitHub Packages. Does not fork PeopleForms / FormBuilder.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = path.join(__dirname, "..");
const TEMPLATE = path.join(PKG_ROOT, "templates", "app-shell");
const DEPLOY_TEMPLATES = path.join(PKG_ROOT, "templates");

function parseArgs(argv) {
  const out = {
    name: null,
    prefix: null,
    productName: null,
    port: 3000,
    db: "sqlite",
    dir: null,
    deploy: true,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === "--name") out.name = next();
    else if (a === "--prefix") out.prefix = next();
    else if (a === "--product-name") out.productName = next();
    else if (a === "--port") out.port = Number(next());
    else if (a === "--db") out.db = next();
    else if (a === "--dir" || a === "--out") out.dir = next();
    else if (a === "--with-deploy") out.deploy = true;
    else if (a === "--no-deploy") out.deploy = false;
    else if (a === "--help" || a === "-h") out.help = true;
  }
  return out;
}

function usage() {
  console.log(`Usage:
  npx @llanesleonardo/create-saas --name <slug> --prefix <cookie_api_prefix_>

Options:
  --product-name "Display Name"   default: title-cased --name
  --dir <path>                    default: ./<slug> under current directory
  --port 3000                     default: 3000
  --db sqlite|memory              default: sqlite
  --with-deploy                   Docker + multi-cloud stubs (default)
  --no-deploy                     skip Docker / deploy templates

Requires NODE_AUTH_TOKEN (GitHub PAT with read:packages) for npm install afterward.
`);
}

function die(msg) {
  console.error(`create-saas: ${msg}`);
  process.exit(1);
}

function slugify(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleCase(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function ensurePrefix(prefix) {
  const p = prefix.trim();
  if (!/^[a-z][a-z0-9_]*_$/i.test(p)) {
    die(`--prefix must look like "acme_" (letters/numbers/underscore, end with _)`);
  }
  return p.toLowerCase();
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function write(file, content) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, content, "utf8");
}

function copyDir(src, dest, { skip = [] } = {}) {
  ensureDir(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (skip.includes(entry.name)) continue;
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      copyDir(from, to, { skip });
    } else {
      fs.copyFileSync(from, to);
    }
  }
}

function walkFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, files);
    else files.push(full);
  }
  return files;
}

function replaceInFile(file, pairs) {
  let text = fs.readFileSync(file, "utf8");
  for (const [from, to] of pairs) {
    text = text.split(from).join(to);
  }
  fs.writeFileSync(file, text, "utf8");
}

function applyTokens(text, tokens) {
  let out = text;
  for (const [key, value] of Object.entries(tokens)) {
    out = out.split(key).join(String(value));
  }
  return out;
}

function copyTplTree(srcDir, destDir, tokens) {
  if (!fs.existsSync(srcDir)) return;
  ensureDir(destDir);
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    if (entry.name === "app-shell") continue;
    const from = path.join(srcDir, entry.name);
    if (entry.isDirectory()) {
      copyTplTree(from, path.join(destDir, entry.name), tokens);
      continue;
    }
    if (entry.name === "README.md" && path.resolve(srcDir) === path.resolve(DEPLOY_TEMPLATES)) {
      continue;
    }
    let destName = entry.name;
    if (destName.endsWith(".tpl")) destName = destName.slice(0, -4);
    const raw = fs.readFileSync(from, "utf8");
    write(path.join(destDir, destName), applyTokens(raw, tokens));
  }
}

function applyDeployTemplates(dest, { slug, productName, port }) {
  const volumePrefix = slug.replace(/-/g, "");
  const tokens = {
    __APP_SLUG__: slug,
    __APP_NAME__: productName,
    __APP_PORT__: String(port),
    __VOLUME_PREFIX__: volumePrefix,
  };

  for (const [tpl, outName] of [
    ["Dockerfile.tpl", "Dockerfile"],
    ["docker-compose.yml.tpl", "docker-compose.yml"],
    [".dockerignore.tpl", ".dockerignore"],
  ]) {
    const from = path.join(DEPLOY_TEMPLATES, tpl);
    if (!fs.existsSync(from)) continue;
    write(path.join(dest, outName), applyTokens(fs.readFileSync(from, "utf8"), tokens));
  }

  copyTplTree(path.join(DEPLOY_TEMPLATES, "deploy"), path.join(dest, "deploy"), tokens);
  copyTplTree(path.join(DEPLOY_TEMPLATES, "scripts"), path.join(dest, "scripts"), tokens);
}

function shellTs({ productName, prefix, workspaceCookie, db }) {
  return `import {
  createShellRegistration,
  getShellDb,
  DEFAULT_SESSION_COOKIE,
} from "@llanesleonardo/saas-product-shell";

const { ensureRegistered } = createShellRegistration({
  productName: ${JSON.stringify(productName)},
  apiKeyPrefix: ${JSON.stringify(prefix)},
  workspaceCookieName: ${JSON.stringify(workspaceCookie)},
  scopes: ["demo:read", "demo:write"],
  features: ["demo"],
  quotas: ["max_seats"],
  metrics: ["actions"],
});

ensureRegistered();

export function getDb() {
  const provider =
    (process.env.DATABASE_PROVIDER as "memory" | "sqlite" | undefined) ??
    ${JSON.stringify(db)};
  return getShellDb({
    provider,
    maxOwnedWorkspacesPerUser: 5,
  });
}

export function getSessionIdFromCookieHeader(
  cookieHeader: string | null,
): string | undefined {
  if (!cookieHeader) return undefined;
  const name = DEFAULT_SESSION_COOKIE;
  const match = cookieHeader.match(new RegExp(\`(?:^|;\\\\s*)\${name}=([^;]*)\`));
  return match?.[1] ? decodeURIComponent(match[1]) : undefined;
}

export function authDeps(request: Request) {
  return {
    getDb,
    sessionCookieName: DEFAULT_SESSION_COOKIE,
    getSessionId: () =>
      getSessionIdFromCookieHeader(request.headers.get("cookie")),
  };
}
`;
}

function proxyTs() {
  return `import { createShellProxy } from "@llanesleonardo/saas-product-shell/middleware";

export const proxy = createShellProxy({
  publicExact: ["/", "/pricing"],
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
`;
}

function envExample({ slug, db, port }) {
  return `# Generated by @llanesleonardo/create-saas — copy to .env.local
DEPLOYMENT_MODE=saas
DATABASE_PROVIDER=${db}
SQLITE_PATH=./data/${slug}.db
NEXT_PUBLIC_APP_URL=http://localhost:${port}

# Postgres (when DATABASE_PROVIDER=postgres)
# DATABASE_URL=postgresql://user:pass@localhost:5432/${slug}
# DATABASE_SSL=0

# Stripe (optional until paid plans)
# STRIPE_SECRET_KEY=sk_test_...
# STRIPE_PRICE_PRO=price_...
# STRIPE_PRICE_BUSINESS=price_...
# STRIPE_WEBHOOK_SECRET=whsec_...

# Email (optional — Resend)
# RESEND_API_KEY=re_...
# RESEND_FROM_EMAIL="My App <onboarding@resend.dev>"

# Secrets at rest (required in saas/production/strict) — openssl rand -base64 32
# SECRETS_ENCRYPTION_KEY=

# Rate limits (requests per minute)
# RATE_LIMIT_LOGIN=10
# RATE_LIMIT_SUBMIT=60
# TRUSTED_PROXY=1

# Object storage (chassis @llanesleonardo/saas-platform/storage)
# local (default) | azure | s3
# STORAGE_PROVIDER=local
#
# Azure Blob (ACA / managed identity) — also: npm i @azure/storage-blob @azure/identity
# STORAGE_PROVIDER=azure
# AZURE_STORAGE_ACCOUNT_NAME=
# AZURE_STORAGE_BLOB_ENDPOINT=https://<account>.blob.core.windows.net
# AZURE_STORAGE_CONTAINER_UPLOADS=uploads
# AZURE_STORAGE_CONTAINER_POLICIES=policies
# AZURE_CLIENT_ID=
# AZURE_STORAGE_PUBLIC_URL=
#
# S3-compatible (AWS / DO Spaces / GCS HMAC) — also: npm i @aws-sdk/client-s3
# STORAGE_PROVIDER=s3
# S3_ENDPOINT=https://s3.<region>.amazonaws.com
# S3_BUCKET=
# S3_ACCESS_KEY_ID=
# S3_SECRET_ACCESS_KEY=
# S3_PUBLIC_URL=
# S3_REGION=auto

# Logging
# LOG_DIR=./logsfiles
# LOG_STDOUT=1
`;
}

function readme({ productName, slug, port, deploy }) {
  return `# ${productName}

Scaffolded with \`@llanesleonardo/create-saas\` (chassis + product shell).  
**Not** a PeopleForms / FormBuilder fork.

## Setup

\`\`\`bash
# GitHub Packages auth (read:packages)
# .npmrc is already included — set:
#   set NODE_AUTH_TOKEN=ghp_...   (Windows)
#   export NODE_AUTH_TOKEN=ghp_... (macOS/Linux)

npm install
cp .env.example .env.local
npm run dev
# → http://localhost:${port}
\`\`\`

## Flow

1. \`/setup\` → first admin  
2. \`/onboarding\` → workspace  
3. \`/workspaces\` / \`/account\`  
4. \`/pricing\` → Stripe when env vars set  
5. Build your domain under \`src/domain/\`

${
  deploy
    ? `## Docker / cloud

- \`Dockerfile\` + \`docker-compose.yml\`
- \`deploy/\` — Vercel, DigitalOcean, AWS, GCP (+ Azure reuse notes)
- PeopleForms-only pieces are marked **PLACEHOLDER**

\`\`\`bash
docker compose up --build
\`\`\`
`
    : ""
}`;
}

function packageJson({ slug, port }) {
  return `{
  "name": "${slug}",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --port ${port}",
    "build": "next build",
    "build:worker": "esbuild scripts/worker.mjs --bundle --platform=node --target=node20 --format=esm --outfile=dist/worker.js --packages=external",
    "worker": "node --import tsx scripts/worker.mjs",
    "db:migrate": "node scripts/migrate-postgres.mjs",
    "start": "next start --port ${port}",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@llanesleonardo/saas-platform": "0.3.0",
    "@llanesleonardo/saas-product-shell": "0.2.1",
    "better-sqlite3": "^12.11.1",
    "next": "16.2.10",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "stripe": "^22.3.2"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.13",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "esbuild": "^0.25.0",
    "tsx": "^4.19.0",
    "typescript": "^5"
  }
}
`;
}

function nextConfig() {
  return `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: [
    "@llanesleonardo/saas-platform",
    "@llanesleonardo/saas-product-shell",
  ],
  serverExternalPackages: ["better-sqlite3", "pg"],
};

export default nextConfig;
`;
}

function tsconfig() {
  return `{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
`;
}

function npmrc() {
  return `@llanesleonardo:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=\${NODE_AUTH_TOKEN}
`;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.name || !args.prefix) {
    usage();
    if (!args.help) process.exit(1);
    return;
  }

  if (!fs.existsSync(path.join(TEMPLATE, "src", "app"))) {
    die(`embedded app-shell template missing at ${TEMPLATE}`);
  }

  const slug = slugify(args.name);
  if (!slug) die("invalid --name");
  const prefix = ensurePrefix(args.prefix);
  const productName = args.productName?.trim() || titleCase(slug);
  const workspaceCookie = `${prefix.replace(/_$/, "")}_workspace`;
  const db = args.db === "memory" ? "memory" : "sqlite";
  const port = Number.isFinite(args.port) && args.port > 0 ? args.port : 3000;

  const dest = path.resolve(process.cwd(), args.dir ?? slug);
  if (fs.existsSync(dest) && fs.readdirSync(dest).length > 0) {
    die(`destination not empty: ${dest}`);
  }

  console.log(`create-saas: ${productName} → ${dest}`);
  ensureDir(dest);

  copyDir(path.join(TEMPLATE, "src"), path.join(dest, "src"), { skip: ["scripts"] });

  for (const file of walkFiles(path.join(dest, "src"))) {
    if (!/\.(tsx?|jsx?|md)$/.test(file)) continue;
    replaceInFile(file, [
      ["ShellDemo", productName],
      ["shell_workspace", workspaceCookie],
      ["localhost:3012", `localhost:${port}`],
    ]);
  }

  write(
    path.join(dest, "src", "lib", "shell.ts"),
    shellTs({ productName, prefix, workspaceCookie, db }),
  );
  write(path.join(dest, "src", "proxy.ts"), proxyTs());

  const pricing = path.join(dest, "src", "app", "pricing", "page.tsx");
  if (fs.existsSync(pricing)) {
    replaceInFile(pricing, [
      [
        'from "@llanesleonardo/saas-product-shell"',
        'from "@llanesleonardo/saas-product-shell/billing"',
      ],
    ]);
  }

  for (const rel of [
    "src/app/api/stripe/checkout/route.ts",
    "src/app/api/stripe/portal/route.ts",
  ]) {
    const f = path.join(dest, rel);
    if (!fs.existsSync(f)) continue;
    let text = fs.readFileSync(f, "utf8");
    if (text.includes("DEFAULT_WORKSPACE_COOKIE")) {
      text = text.replace(/DEFAULT_WORKSPACE_COOKIE/g, "workspaceCookieName");
    }
    fs.writeFileSync(f, text, "utf8");
  }

  write(
    path.join(dest, "src", "domain", "README.md"),
    `# Domain (product-owned)

Put business tables and routes here. Chassis/shell stay free of CRM/ERP types.

- \`migrations/\` — optional \`postgres.sql\` baseline + \`versions/*.sql\`
- \`jobs.ts\` — optional \`registerJobHandlers()\` for the outbox worker
`,
  );
  write(path.join(dest, "src", "domain", "migrations", "versions", ".gitkeep"), "");
  write(
    path.join(dest, "src", "domain", "jobs.ts"),
    `/**
 * Optional outbox handlers. Called by scripts/worker.mjs on boot.
 *
 * import { registerJobHandler } from "@llanesleonardo/saas-platform/core";
 *
 * export function registerJobHandlers() {
 *   registerJobHandler("my_job", async (job) => {
 *     // ...
 *   });
 * }
 */
export function registerJobHandlers() {
  // no-op until you add handlers
}
`,
  );

  write(path.join(dest, "package.json"), packageJson({ slug, port }));
  write(path.join(dest, "next.config.ts"), nextConfig());
  write(path.join(dest, "tsconfig.json"), tsconfig());
  write(path.join(dest, ".env.example"), envExample({ slug, db, port }));
  write(path.join(dest, "README.md"), readme({ productName, slug, port, deploy: args.deploy }));
  write(
    path.join(dest, ".gitignore"),
    `node_modules
.next
data
.env.local
.github-packages-token
`,
  );
  write(path.join(dest, ".npmrc"), npmrc());
  write(
    path.join(dest, "next-env.d.ts"),
    `/// <reference types="next" />
/// <reference types="next/image-types/global" />
`,
  );
  write(path.join(dest, "data", ".gitkeep"), "");

  if (args.deploy) {
    applyDeployTemplates(dest, { slug, productName, port });
  }

  console.log(`
OK — created ${dest}

Next:
  1. cd ${dest}
  2. set NODE_AUTH_TOKEN=<GitHub PAT with read:packages>
  3. npm install
  4. copy .env.example → .env.local
  5. npm run dev  → http://localhost:${port}
${args.deploy ? "  6. optional: docker compose up --build\n" : ""}
Storage (optional): set STORAGE_PROVIDER=azure|s3 in .env.local and install peers
  (see .env.example comments).

Packages used: @llanesleonardo/saas-platform@0.3.0 + saas-product-shell@0.2.1
`);
}

main();
