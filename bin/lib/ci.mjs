/**
 * Per-product CI checklist (Epic 13 / GAP-1504 / phase 82).
 * Typecheck + import guard (fail on people-forms / FormBuilder imports).
 */
import path from "path";
import { write } from "./shared.mjs";

export function writeCiAssets(appRoot) {
  write(
    path.join(appRoot, "scripts", "check-import-guard.mjs"),
    `/**
 * Fail if this product imports PeopleForms / FormBuilder internals.
 * HISTORY: Epic 13 phase 82 — new SaaS apps must use create-saas + shell, not fork people-forms.
 */
import fs from "fs";
import path from "path";

const root = process.cwd();
const forbidden = [
  /apps\\/people-forms/,
  /@peopleforms\\/people-forms/,
  /peopleForms\\/apps/,
  /FormBuilder/,
  /from\\s+["'].*people-forms/,
];

let failed = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next" || entry.name === "dist") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (!/\\.(ts|tsx|js|mjs|jsx)$/.test(entry.name)) continue;
    const text = fs.readFileSync(full, "utf8");
    for (const re of forbidden) {
      if (re.test(text)) {
        console.error(\`[import-guard] \${path.relative(root, full)} matches \${re}\`);
        failed += 1;
      }
    }
  }
}

walk(path.join(root, "src"));
if (failed > 0) {
  console.error(\`\\n\${failed} import-guard violation(s) — do not fork PeopleForms; use create-saas.\`);
  process.exit(1);
}
console.log("import-guard OK");
`,
  );

  write(
    path.join(appRoot, ".github", "workflows", "ci.yml"),
    `# Epic 13 / phase 82 — product checklist CI
name: CI

on:
  pull_request:
  push:
    branches: [main, develop]

permissions:
  contents: read
  packages: read

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          registry-url: https://npm.pkg.github.com
          scope: "@llanesleonardo"
      - name: Install
        run: npm ci
        env:
          NODE_AUTH_TOKEN: \${{ secrets.GITHUB_TOKEN }}
      - name: Import guard
        run: node scripts/check-import-guard.mjs
      - name: Typecheck
        run: npm run typecheck
`,
  );
}
