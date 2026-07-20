import { NextResponse } from "next/server";
import {
  DEMO_PLAN_CATALOG,
  getPlanDefinition,
} from "@llanesleonardo/saas-product-shell/billing/catalog";
import {
  requireActiveWorkspace,
  workspaceCookieName,
} from "@llanesleonardo/saas-product-shell/tenancy";
import { resolveSessionUser } from "@llanesleonardo/saas-product-shell/auth";
import { ShellError } from "@llanesleonardo/saas-product-shell/errors";
import { authDeps, getDb } from "@/lib/shell";

function deploymentMode(): "saas" | "selfhosted" {
  return (process.env.DEPLOYMENT_MODE ?? "").trim().toLowerCase() === "saas"
    ? "saas"
    : "selfhosted";
}

export async function GET(request: Request) {
  try {
    const deps = authDeps(request);
    const db = getDb();
    const user = await resolveSessionUser(db, deps.getSessionId(request));
    if (!user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const cookieHeader = request.headers.get("cookie") ?? "";
    const cookieName = workspaceCookieName();
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${cookieName}=([^;]*)`));
    const cookieWs = match?.[1] ? decodeURIComponent(match[1]) : null;

    const workspaceId = await requireActiveWorkspace(db, user.id, cookieWs, "viewer");
    const workspace = await db.getWorkspaceById(workspaceId);
    const plan = getPlanDefinition(DEMO_PLAN_CATALOG, workspace?.plan);

    return NextResponse.json({
      mode: deploymentMode(),
      workspace: workspace
        ? {
            id: workspace.id,
            name: workspace.name,
            plan: workspace.plan,
            subscription_status: workspace.subscription_status ?? null,
            has_stripe_customer: Boolean(workspace.stripe_customer_id),
          }
        : null,
      plan,
      catalog: DEMO_PLAN_CATALOG,
    });
  } catch (err) {
    if (err instanceof ShellError && err.details?.includes("NO_WORKSPACE")) {
      return NextResponse.json(
        { error: "Create a workspace first", code: "NO_WORKSPACE" },
        { status: 400 },
      );
    }
    const message = err instanceof Error ? err.message : "Billing failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
