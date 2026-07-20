import { authDeps } from "@/lib/shell";
import {
  createSessionsListHandler,
  createSessionRevokeHandler,
} from "@llanesleonardo/saas-product-shell";

export async function GET(request: Request) {
  return createSessionsListHandler(authDeps(request))(request);
}

export async function DELETE(request: Request) {
  return createSessionRevokeHandler(authDeps(request))(request);
}
