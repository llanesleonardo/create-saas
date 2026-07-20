/**
 * Outbox worker entry (scaffolded by create-saas).
 *
 * Registers product job handlers (if any), then drains the chassis outbox loop.
 * Dev:  npm run worker
 * Docker: node worker.js (after npm run build:worker)
 *
 * Domain handlers: import and register in src/domain/jobs.ts (optional).
 */
import { createRequire } from "module";
import { pathToFileURL } from "url";
import path from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

async function loadDomainJobs() {
  const candidates = [
    path.join(root, "src", "domain", "jobs.ts"),
    path.join(root, "src", "domain", "jobs.js"),
  ];
  for (const file of candidates) {
    try {
      const mod = await import(pathToFileURL(file).href);
      if (typeof mod.registerJobHandlers === "function") {
        mod.registerJobHandlers();
      }
    } catch {
      // optional
    }
  }
}

async function main() {
  await loadDomainJobs();

  const { getShellDb } = await import("@llanesleonardo/saas-product-shell/db");
  const { runWorkerLoop } = await import("@llanesleonardo/saas-platform/server");

  const provider =
    (process.env.DATABASE_PROVIDER ?? "sqlite").trim().toLowerCase() === "memory"
      ? "memory"
      : "sqlite";

  const db = getShellDb({
    provider,
    maxOwnedWorkspacesPerUser: Number(process.env.MAX_OWNED_WORKSPACES ?? "5") || 5,
  });

  const logger = {
    info: (msg, meta) => console.log(`[worker] ${msg}`, meta ?? ""),
    warn: (msg, meta) => console.warn(`[worker] ${msg}`, meta ?? ""),
    error: (msg, meta) => console.error(`[worker] ${msg}`, meta ?? ""),
  };

  const ac = new AbortController();
  process.on("SIGINT", () => ac.abort());
  process.on("SIGTERM", () => ac.abort());

  console.log("[worker] starting outbox loop");
  await runWorkerLoop(db, { signal: ac.signal, logger });
}

main().catch((err) => {
  console.error("[worker] fatal", err);
  process.exit(1);
});
