#!/usr/bin/env node
/**
 * Sync shared Software Patterns Docs into a product repo.
 *
 *   npx @llanesleonardo/create-saas sync-docs --dir .
 *
 * Requires: @llanesleonardo/software-patterns-docs (devDependency).
 * Also ensures docs/Components + docs/Development folder structure exists.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { die, ensureDir, write } from "./lib/shared.mjs";

const require = createRequire(import.meta.url);

function parseDir(argv) {
  let dir = process.cwd();
  for (let i = 0; i < argv.length; i++) {
    if ((argv[i] === "--dir" || argv[i] === "--out") && argv[i + 1]) {
      dir = path.resolve(argv[++i]);
    }
  }
  return dir;
}

function ensureDocsSkeleton(dir) {
  const components = path.join(dir, "docs", "Components", "README.md");
  const development = path.join(dir, "docs", "Development", "README.md");
  const patternsReadme = path.join(dir, "docs", "Software Patterns Docs", "README.md");

  if (!fs.existsSync(components)) {
    write(
      components,
      `# Components

Product-surface docs (one folder per UI/area). Fill as you build domain features.

**Agents:** use the **saas-docs-picture** skill with Development + Software Patterns Docs.
`,
    );
  }
  if (!fs.existsSync(development)) {
    write(
      development,
      `# Development

Architecture, dual-mode, and planning docs for this product.

Add \`architecture-overview.md\` and epic/phase folders as needed.

**Agents:** use the **saas-docs-picture** skill before architectural decisions.
`,
    );
  }
  ensureDir(path.join(dir, "docs", "Software Patterns Docs"));
  if (!fs.existsSync(patternsReadme)) {
    write(
      patternsReadme,
      `# Software Patterns Docs

Synced from \`@llanesleonardo/software-patterns-docs\`.

\`\`\`bash
npx @llanesleonardo/create-saas sync-docs --dir .
\`\`\`
`,
    );
  }
}

export function run(argv = process.argv.slice(2)) {
  const dir = parseDir(argv);
  if (!fs.existsSync(path.join(dir, "package.json"))) {
    die(`no package.json in ${dir}`);
  }

  ensureDocsSkeleton(dir);

  let syncBin;
  try {
    const pkgEntry = require.resolve("@llanesleonardo/software-patterns-docs", {
      paths: [dir, process.cwd()],
    });
    const pkgRoot = path.dirname(pkgEntry);
    syncBin = path.join(pkgRoot, "bin", "sync.mjs");
  } catch {
    die(
      "install @llanesleonardo/software-patterns-docs first (devDependency), then re-run sync-docs",
    );
  }

  if (!fs.existsSync(syncBin)) {
    die(`sync script missing at ${syncBin}`);
  }

  const result = spawnSync(process.execPath, [syncBin, "--dir", dir], {
    stdio: "inherit",
    cwd: dir,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  console.log("create-saas sync-docs: Components + Development skeleton OK; patterns synced");
}

const isDirect =
  process.argv[1] &&
  path.normalize(process.argv[1]).endsWith(`${path.sep}sync-docs.mjs`);
if (isDirect) run(process.argv.slice(2));
