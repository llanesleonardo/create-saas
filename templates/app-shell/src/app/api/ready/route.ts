import { getDb } from "@/lib/shell";

/**
 * Readiness probe — 503 when the database is unreachable.
 */
export async function GET() {
  let up = false;
  try {
    up = await getDb().ping();
  } catch {
    up = false;
  }
  return Response.json(
    {
      ok: up,
      product: "ShellDemo",
      db: up ? "up" : "down",
    },
    { status: up ? 200 : 503 },
  );
}
