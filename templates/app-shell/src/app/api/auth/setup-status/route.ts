import { createSetupStatusHandler } from "@llanesleonardo/saas-product-shell/auth";
import { getDb } from "@/lib/shell";

export async function GET() {
  return createSetupStatusHandler({ getDb })();
}
