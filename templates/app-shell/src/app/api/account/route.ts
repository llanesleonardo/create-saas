import { authDeps } from "@/lib/shell";
import { createAccountDeleteHandler } from "@llanesleonardo/saas-product-shell";

export async function DELETE(request: Request) {
  return createAccountDeleteHandler(authDeps(request))(request);
}
