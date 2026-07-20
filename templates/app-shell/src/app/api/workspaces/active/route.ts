import { authDeps } from "@/lib/shell";
import { createSwitchWorkspaceHandler } from "@llanesleonardo/saas-product-shell";

export async function POST(request: Request) {
  return createSwitchWorkspaceHandler(authDeps(request))(request);
}
