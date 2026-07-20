import { authDeps } from "@/lib/shell";
import { createMeHandler } from "@llanesleonardo/saas-product-shell";

export async function GET(request: Request) {
  return createMeHandler(authDeps(request))(request);
}
