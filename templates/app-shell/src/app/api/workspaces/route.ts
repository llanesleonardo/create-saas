import { authDeps } from "@/lib/shell";
import {
  createCreateWorkspaceHandler,
  createListWorkspacesHandler,
} from "@llanesleonardo/saas-product-shell";

export async function GET(request: Request) {
  return createListWorkspacesHandler(authDeps(request))(request);
}

export async function POST(request: Request) {
  return createCreateWorkspaceHandler(authDeps(request))(request);
}
