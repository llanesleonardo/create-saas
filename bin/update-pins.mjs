#!/usr/bin/env node
/**
 * update-pins — Epic 13 / GAP-1508 pin helper for scaffolded apps.
 * Updates @llanesleonardo/saas-platform and saas-product-shell versions in package.json.
 *
 *   npx @llanesleonardo/create-saas update-pins --dir . --shell 0.2.2 --platform 0.3.0
 *
 * HISTORY: publish of the shell package itself lives in the saas-product-shell repo
 * (scripts/release.mjs). This command only rewrites consumer pins.
 */
import fs from "fs";
import path from "path";
import { die, write } from "./lib/shared.mjs";

export function run(argv = process.argv.slice(2)) {
  let dir = ".";
  let shell = null;
  let platform = null;
  let changelog = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--dir") dir = argv[++i];
    else if (argv[i] === "--shell") shell = argv[++i];
    else if (argv[i] === "--platform") platform = argv[++i];
    else if (argv[i] === "--changelog") changelog = argv[++i];
    else if (argv[i] === "--help" || argv[i] === "-h") {
      console.log(`Usage: create-saas update-pins --dir ./app [--shell 0.2.2] [--platform 0.3.0] [--changelog "note"]`);
      return;
    }
  }

  const root = path.resolve(process.cwd(), dir);
  const pkgPath = path.join(root, "package.json");
  if (!fs.existsSync(pkgPath)) die(`missing package.json at ${root}`);

  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  pkg.dependencies = pkg.dependencies || {};
  if (platform) {
    pkg.dependencies["@llanesleonardo/saas-platform"] = platform;
    console.log(`pin saas-platform@${platform}`);
  }
  if (shell) {
    pkg.dependencies["@llanesleonardo/saas-product-shell"] = shell;
    console.log(`pin saas-product-shell@${shell}`);
  }
  if (!platform && !shell) die("pass --shell and/or --platform");

  write(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

  if (changelog) {
    const cl = path.join(root, "CHANGELOG.md");
    const stamp = new Date().toISOString().slice(0, 10);
    const entry = `## ${stamp}\n\n- ${changelog}\n\n`;
    const prev = fs.existsSync(cl) ? fs.readFileSync(cl, "utf8") : "# Changelog\n\n";
    write(cl, prev.startsWith("#") ? prev.replace("# Changelog\n\n", `# Changelog\n\n${entry}`) : entry + prev);
    console.log("CHANGELOG.md updated");
  }

  console.log(`
OK — pins updated in ${pkgPath}
Next: set NODE_AUTH_TOKEN and run npm install
(Publish shell itself from the saas-product-shell repo: npm run release)
`);
}

const isDirect =
  process.argv[1] &&
  (process.argv[1].endsWith("update-pins.mjs") ||
    process.argv[1].includes(`${path.sep}update-pins`));

if (isDirect) {
  run(process.argv.slice(2));
}
