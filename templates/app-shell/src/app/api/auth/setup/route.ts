import { authDeps } from "@/lib/shell";
import { createSetupHandler } from "@llanesleonardo/saas-product-shell";

export async function POST(request: Request) {
  return createSetupHandler(authDeps(request))(request);
}
