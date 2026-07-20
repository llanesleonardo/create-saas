import { authDeps } from "@/lib/shell";
import { createLogoutHandler } from "@llanesleonardo/saas-product-shell";

export async function POST(request: Request) {
  return createLogoutHandler(authDeps(request))(request);
}
