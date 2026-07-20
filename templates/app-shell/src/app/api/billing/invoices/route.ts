import { NextResponse } from "next/server";
import {
  requireActiveWorkspace,
  workspaceCookieName,
} from "@llanesleonardo/saas-product-shell/tenancy";
import { resolveSessionUser } from "@llanesleonardo/saas-product-shell/auth";
import { ShellError } from "@llanesleonardo/saas-product-shell/errors";
import { authDeps, getDb } from "@/lib/shell";

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
    const workspaceId = await requireActiveWorkspace(db, user.id, cookieWs, "admin");
    const workspace = await db.getWorkspaceById(workspaceId);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const key = process.env.STRIPE_SECRET_KEY?.trim();
    if (!key || !workspace.stripe_customer_id) {
      return NextResponse.json({ invoices: [], stripeConfigured: Boolean(key) });
    }

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(key);
    const list = await stripe.invoices.list({
      customer: workspace.stripe_customer_id,
      limit: 24,
    });

    return NextResponse.json({
      stripeConfigured: true,
      invoices: list.data.map((inv) => ({
        id: inv.id,
        created: inv.created,
        status: inv.status,
        currency: inv.currency,
        amount_paid: inv.amount_paid,
        amount_due: inv.amount_due,
        hosted_invoice_url: inv.hosted_invoice_url,
        invoice_pdf: inv.invoice_pdf,
        number: inv.number,
      })),
    });
  } catch (err) {
    if (err instanceof ShellError && err.details?.includes("NO_WORKSPACE")) {
      return NextResponse.json(
        { error: "Create a workspace first", code: "NO_WORKSPACE", invoices: [] },
        { status: 400 },
      );
    }
    const message = err instanceof Error ? err.message : "Invoices failed";
    return NextResponse.json({ error: message, invoices: [] }, { status: 400 });
  }
}
