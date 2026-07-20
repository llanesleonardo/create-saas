import { cookies } from "next/headers";
import {
  DEFAULT_SESSION_COOKIE,
  resolveSessionUser,
} from "@llanesleonardo/saas-product-shell/auth";
import { getDb } from "@/lib/shell";

export async function getCurrentUser() {
  const jar = await cookies();
  const sessionId = jar.get(DEFAULT_SESSION_COOKIE)?.value;
  if (!sessionId) return null;
  return resolveSessionUser(getDb(), sessionId);
}
