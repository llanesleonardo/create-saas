#!/usr/bin/env node
/**
 * @llanesleonardo/create-saas
 *
 * Scaffold a new SaaS app on chassis + product shell — independent of PeopleForms.
 *
 *   npx @llanesleonardo/create-saas --name acme-crm --prefix acme_
 *   npx @llanesleonardo/create-saas --wizard
 *
 * HISTORY: Epic 13 High/Medium — brand wizard, --entity stubs, CI import-guard,
 * --with-stripe/--with-clerk/--db=postgres, update-pins / add-domain subcommands.
 * Does not fork PeopleForms / FormBuilder.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  die,
  ensureDir,
  write,
  slugify,
  titleCase,
  ensurePrefix,
  parseArgs,
  usage,
  runWizard,
  normalizeDb,
} from "./lib/shared.mjs";
import { generateDomainStub } from "./lib/domain-stub.mjs";
import { writeCiAssets } from "./lib/ci.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = path.join(__dirname, "..");
const TEMPLATE = path.join(PKG_ROOT, "templates", "app-shell");
const DEPLOY_TEMPLATES = path.join(PKG_ROOT, "templates");

const PLATFORM_PIN = "0.3.0";
const SHELL_PIN = "0.2.2";

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

function shellTs({ productName, apiKeyPrefix, workspaceCookie, db }) {
  const providerType =
    db === "postgres"
      ? `"memory" | "sqlite" | "postgres"`
      : `"memory" | "sqlite"`;
  return `import {
  createShellRegistration,
  getShellDb,
  DEFAULT_SESSION_COOKIE,
} from "@llanesleonardo/saas-product-shell";

const { ensureRegistered } = createShellRegistration({
  productName: ${JSON.stringify(productName)},
  apiKeyPrefix: ${JSON.stringify(apiKeyPrefix)},
  workspaceCookieName: ${JSON.stringify(workspaceCookie)},
  scopes: ["demo:read", "demo:write"],
  features: ["demo"],
  quotas: ["max_seats"],
  metrics: ["actions"],
});

ensureRegistered();

export function getDb() {
  const provider =
    (process.env.DATABASE_PROVIDER as ${providerType} | undefined) ??
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

function envExample({ slug, db, port, withStripe, withClerk, apiKeyPrefix }) {
  const stripeBlock = withStripe
    ? `# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_BUSINESS=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
`
    : `# Stripe (enable with create-saas --with-stripe)
# STRIPE_SECRET_KEY=
`;

  const clerkBlock = withClerk
    ? `# Clerk IdP stub (wire @clerk/nextjs yourself — see src/lib/clerk-stub.ts)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
`
    : `# Clerk (enable with create-saas --with-clerk)
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
# CLERK_SECRET_KEY=
`;

  return `# Generated by @llanesleonardo/create-saas — copy to .env.local
DEPLOYMENT_MODE=saas
DATABASE_PROVIDER=${db}
SQLITE_PATH=./data/${slug}.db
NEXT_PUBLIC_APP_URL=http://localhost:${port}
# API keys issued by this product use prefix: ${apiKeyPrefix}

# Postgres (when DATABASE_PROVIDER=postgres)
# DATABASE_URL=postgresql://user:pass@localhost:5432/${slug}
# DATABASE_SSL=0

${stripeBlock}
${clerkBlock}
# Email (optional — Resend)
# RESEND_API_KEY=re_...
# RESEND_FROM_EMAIL="My App <onboarding@resend.dev>"

# Secrets at rest — openssl rand -base64 32
# SECRETS_ENCRYPTION_KEY=

# SESSION_SECRET — min 32 chars in production
SESSION_SECRET=dev-only-change-me-to-a-long-random-string

# Object storage (chassis)
# STORAGE_PROVIDER=local
# STORAGE_PROVIDER=azure | s3  (see chassis docs)

# Logging
# LOG_DIR=./logsfiles
# LOG_STDOUT=1
`;
}

function clerkStubTs() {
  return `/**
 * Clerk IdP stub (Epic 13 / --with-clerk).
 * HISTORY: scaffold only — install @clerk/nextjs and wire providers; do not copy PeopleForms.
 *
 * Suggested next steps:
 * 1. npm i @clerk/nextjs
 * 2. Wrap root layout with ClerkProvider
 * 3. Map Clerk user → chassis user via shell IdP helpers when you add them
 */
export const clerkStub = {
  enabled: Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY),
  publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "",
};
`;
}

function readme({ productName, slug, port, deploy, withStripe, withClerk, db }) {
  return `# ${productName}

Scaffolded with \`@llanesleonardo/create-saas\` (chassis + product shell).  
**Not** a PeopleForms / FormBuilder fork.

## Setup

\`\`\`bash
# GitHub Packages auth (read:packages)
#   set NODE_AUTH_TOKEN=ghp_...   (Windows)
#   export NODE_AUTH_TOKEN=ghp_... (macOS/Linux)

npm install
cp .env.example .env.local
npm run dev
# → http://localhost:${port}
\`\`\`

Database provider: \`${db}\`${db === "postgres" ? " — set \`DATABASE_URL\` then \`npm run db:migrate\`." : "."}

${withStripe ? "Stripe kit included (`/pricing`, `/api/stripe/*`)." : "Stripe kit omitted (`--no-stripe`)."}
${withClerk ? "Clerk stub at \`src/lib/clerk-stub.ts\` — wire \`@clerk/nextjs\` yourself." : ""}

## Flow

1. \`/setup\` → first admin  
2. \`/onboarding\` → workspace  
3. \`/workspaces\` / \`/account\`  
4. Build your domain under \`src/domain/\` (or \`npx @llanesleonardo/create-saas add-domain --entity contacts\`)

## CI

\`.github/workflows/ci.yml\` runs typecheck + \`scripts/check-import-guard.mjs\` (blocks PeopleForms imports).

${
  deploy
    ? `## Docker / cloud

- \`Dockerfile\` + \`docker-compose.yml\`
- \`deploy/\` — Vercel, DigitalOcean, AWS, GCP (+ Azure notes)

\`\`\`bash
docker compose up --build
\`\`\`
`
    : ""
}`;
}

function packageJson({ slug, port, db, withStripe }) {
  const deps = {
    "@llanesleonardo/saas-platform": PLATFORM_PIN,
    "@llanesleonardo/saas-product-shell": SHELL_PIN,
    next: "16.2.10",
    react: "19.2.4",
    "react-dom": "19.2.4",
  };
  if (db !== "memory") deps["better-sqlite3"] = "^12.11.1";
  if (db === "postgres") deps.pg = "^8.22.0";
  if (withStripe) deps.stripe = "^22.3.2";

  const devDeps = {
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    esbuild: "^0.25.0",
    tsx: "^4.19.0",
    typescript: "^5",
  };
  if (db !== "memory") devDeps["@types/better-sqlite3"] = "^7.6.13";

  return `${JSON.stringify(
    {
      name: slug,
      version: "0.1.0",
      private: true,
      scripts: {
        dev: `next dev --port ${port}`,
        build: "next build",
        "build:worker":
          "esbuild scripts/worker.mjs --bundle --platform=node --target=node20 --format=esm --outfile=dist/worker.js --packages=external",
        worker: "node --import tsx scripts/worker.mjs",
        "db:migrate": "node scripts/migrate-postgres.mjs",
        start: `next start --port ${port}`,
        typecheck: "tsc -p tsconfig.json --noEmit",
        "check:imports": "node scripts/check-import-guard.mjs",
      },
      dependencies: deps,
      devDependencies: devDeps,
    },
    null,
    2,
  )}
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

function removeStripeKit(dest) {
  for (const rel of [
    "src/app/api/stripe",
    "src/app/pricing",
  ]) {
    const p = path.join(dest, rel);
    if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
  }
}

function applyRebrand(dest, opts) {
  const { productName, apiKeyPrefix, workspaceCookie, db, port, slug, withStripe, withClerk } =
    opts;
  write(
    path.join(dest, "src", "lib", "shell.ts"),
    shellTs({ productName, apiKeyPrefix, workspaceCookie, db }),
  );
  write(
    path.join(dest, ".env.example"),
    envExample({ slug, db, port, withStripe, withClerk, apiKeyPrefix }),
  );
  console.log(`rebrand OK → ${dest} (${productName})`);
}

function scaffold(args) {
  if (!fs.existsSync(path.join(TEMPLATE, "src", "app"))) {
    die(`embedded app-shell template missing at ${TEMPLATE}`);
  }

  const slug = slugify(args.name);
  if (!slug) die("invalid --name");
  const cookiePrefix = ensurePrefix(args.cookiePrefix || args.prefix, "--prefix");
  const apiKeyPrefix = ensurePrefix(
    args.apiKeyPrefix || cookiePrefix,
    "--api-key-prefix",
  );
  const productName = args.productName?.trim() || titleCase(slug);
  const workspaceCookie = `${cookiePrefix.replace(/_$/, "")}_workspace`;
  const db = normalizeDb(args.db);
  const port = Number.isFinite(args.port) && args.port > 0 ? args.port : 3000;
  const withStripe = args.withStripe !== false;
  const withClerk = Boolean(args.withClerk);

  const dest = path.resolve(process.cwd(), args.dir ?? slug);

  if (args.rebrand) {
    if (!fs.existsSync(path.join(dest, "package.json"))) {
      die(`--rebrand requires an existing app at ${dest}`);
    }
    applyRebrand(dest, {
      productName,
      apiKeyPrefix,
      workspaceCookie,
      db,
      port,
      slug: path.basename(dest),
      withStripe,
      withClerk,
    });
    return;
  }

  if (fs.existsSync(dest) && fs.readdirSync(dest).length > 0) {
    die(`destination not empty: ${dest} (use --rebrand to update brand fields)`);
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
    shellTs({ productName, apiKeyPrefix, workspaceCookie, db }),
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

  if (!withStripe) removeStripeKit(dest);
  if (withClerk) write(path.join(dest, "src", "lib", "clerk-stub.ts"), clerkStubTs());

  write(
    path.join(dest, "src", "domain", "README.md"),
    `# Domain (product-owned)

Put business tables and routes here. Chassis/shell stay free of CRM/ERP types.

- \`migrations/\` — optional \`postgres.sql\` baseline + \`versions/*.sql\`
- \`jobs.ts\` — optional \`registerJobHandlers()\` for the outbox worker

Add a stub: \`npx @llanesleonardo/create-saas add-domain --entity contacts --dir .\`
`,
  );
  write(path.join(dest, "src", "domain", "migrations", "versions", ".gitkeep"), "");
  write(
    path.join(dest, "src", "domain", "jobs.ts"),
    `/**
 * Optional outbox handlers. Called by scripts/worker.mjs on boot.
 */
export function registerJobHandlers() {
  // no-op until you add handlers
}
`,
  );

  write(path.join(dest, "package.json"), packageJson({ slug, port, db, withStripe }));
  write(path.join(dest, "next.config.ts"), nextConfig());
  write(path.join(dest, "tsconfig.json"), tsconfig());
  write(
    path.join(dest, ".env.example"),
    envExample({ slug, db, port, withStripe, withClerk, apiKeyPrefix }),
  );
  write(path.join(dest, ".env.local"), envExample({ slug, db, port, withStripe, withClerk, apiKeyPrefix }));
  write(
    path.join(dest, "README.md"),
    readme({ productName, slug, port, deploy: args.deploy, withStripe, withClerk, db }),
  );
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

  writeCiAssets(dest);

  if (args.deploy) {
    applyDeployTemplates(dest, { slug, productName, port });
  }

  if (args.entity) {
    generateDomainStub(dest, args.entity);
  }

  console.log(`
OK — created ${dest}

Next:
  1. cd ${dest}
  2. set NODE_AUTH_TOKEN=<GitHub PAT with read:packages>
  3. npm install
  4. npm run dev  → http://localhost:${port}
  5. npm run check:imports && npm run typecheck
${args.deploy ? "  6. optional: docker compose up --build\n" : ""}
Pins: @llanesleonardo/saas-platform@${PLATFORM_PIN} + saas-product-shell@${SHELL_PIN}
`);
}

async function main() {
  const argv = process.argv.slice(2);
  const sub = argv[0];

  if (sub === "add-domain") {
    const { run } = await import("./add-domain.mjs");
    run(argv.slice(1));
    return;
  }
  if (sub === "update-pins") {
    const { run } = await import("./update-pins.mjs");
    run(argv.slice(1));
    return;
  }

  let args = parseArgs(argv);
  if (args.help) {
    usage();
    return;
  }

  const needsWizard = args.wizard || !args.name || !(args.prefix || args.cookiePrefix);
  if (needsWizard) {
    args = await runWizard(args);
  }

  if (!args.name || !(args.prefix || args.cookiePrefix)) {
    usage();
    process.exit(1);
  }

  scaffold(args);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
