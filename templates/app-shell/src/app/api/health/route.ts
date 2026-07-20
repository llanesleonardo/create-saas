import { getDb } from "@/lib/shell";

/**
 * Liveness for Docker / load balancers.
 * Always 200 when the process is up; includes db status for operators.
 */
export async function GET() {
  let dbStatus: "up" | "down" | "unknown" = "unknown";
  try {
    const up = await getDb().ping();
    dbStatus = up ? "up" : "down";
  } catch {
    dbStatus = "down";
  }
  return Response.json({
    ok: true,
    product: "ShellDemo",
    db: dbStatus,
  });
}
