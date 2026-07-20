import { authDeps } from "@/lib/shell";
import { createLoginHandler } from "@llanesleonardo/saas-product-shell";

export async function POST(request: Request) {
  return createLoginHandler(authDeps(request))(request);
}
