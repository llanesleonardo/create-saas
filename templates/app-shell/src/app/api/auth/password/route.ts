import { authDeps } from "@/lib/shell";
import { createPasswordChangeHandler } from "@llanesleonardo/saas-product-shell";

export async function POST(request: Request) {
  return createPasswordChangeHandler(authDeps(request))(request);
}
