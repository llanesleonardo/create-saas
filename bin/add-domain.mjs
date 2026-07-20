#!/usr/bin/env node
/**
 * add-domain — Epic 13 / GAP-1503 domain stub for an existing scaffolded app.
 *   npx @llanesleonardo/create-saas add-domain --entity contacts --dir .
 */
import path from "path";
import { die } from "./lib/shared.mjs";
import { generateDomainStub, assertAppRoot } from "./lib/domain-stub.mjs";

export function run(argv = process.argv.slice(2)) {
  let entity = null;
  let dir = ".";
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--entity") entity = argv[++i];
    else if (argv[i] === "--dir" || argv[i] === "--out") dir = argv[++i];
    else if (argv[i] === "--help" || argv[i] === "-h") {
      console.log(`Usage: create-saas add-domain --entity <name> [--dir ./app]`);
      return;
    }
  }
  if (!entity) die("add-domain requires --entity <name>");
  const root = assertAppRoot(path.resolve(process.cwd(), dir));
  generateDomainStub(root, entity);
}

const isDirect =
  process.argv[1] &&
  (process.argv[1].endsWith("add-domain.mjs") ||
    process.argv[1].includes(`${path.sep}add-domain`));

if (isDirect) {
  run(process.argv.slice(2));
}
