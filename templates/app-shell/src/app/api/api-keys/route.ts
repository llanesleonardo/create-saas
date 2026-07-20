import {
  createApiKeyCreateHandler,
  createApiKeysListHandler,
  createApiKeyRevokeHandler,
} from "@llanesleonardo/saas-product-shell/api-keys";
import { authDeps } from "@/lib/shell";

export async function GET(request: Request) {
  return createApiKeysListHandler(authDeps(request))(request);
}

export async function POST(request: Request) {
  return createApiKeyCreateHandler(authDeps(request))(request);
}

export async function DELETE(request: Request) {
  return createApiKeyRevokeHandler(authDeps(request))(request);
}
