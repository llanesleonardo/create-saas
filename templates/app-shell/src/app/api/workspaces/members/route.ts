import { NextResponse } from "next/server";
import {
  getActiveWorkspaceId,
  requireSessionUser,
  requireWorkspaceAccess,
  ShellError,
  jsonError,
} from "@llanesleonardo/saas-product-shell";
import { DEFAULT_WORKSPACE_COOKIE } from "@llanesleonardo/saas-product-shell/middleware";
import { authDeps, getDb } from "@/lib/shell";

function workspaceIdFromCookie(request: Request): string | null {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(
    new RegExp(`(?:^|;\\s*)${DEFAULT_WORKSPACE_COOKIE}=([^;]*)`),
  );
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export async function GET(request: Request) {
  try {
    const deps = authDeps(request);
    const db = getDb();
    const user = await requireSessionUser(db, deps.getSessionId(request));
    const workspaceId = await getActiveWorkspaceId(
      db,
      user.id,
      workspaceIdFromCookie(request),
    );
    if (!workspaceId) {
      throw ShellError.validation("Create a workspace first", ["NO_WORKSPACE"]);
    }
    await requireWorkspaceAccess(db, user.id, workspaceId, "viewer");
    const members = await db.listWorkspaceMembers(workspaceId);
    return NextResponse.json({
      members,
      seats: { used: members.length },
    });
  } catch (err) {
    return jsonError(err);
  }
}
