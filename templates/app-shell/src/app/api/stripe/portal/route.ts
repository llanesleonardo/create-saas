import { authDeps } from "@/lib/shell";
import {
  createBillingPortalHandler,
  DEMO_PLAN_CATALOG,
  workspaceCookieName,
} from "@llanesleonardo/saas-product-shell";

function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

function getStripe() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Stripe = require("stripe") as typeof import("stripe").default;
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

function workspaceFromCookie(request: Request) {
  const header = request.headers.get("cookie") ?? "";
  const name = workspaceCookieName();
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export async function POST(request: Request) {
  return createBillingPortalHandler({
    ...authDeps(request),
    catalog: DEMO_PLAN_CATALOG,
    getStripe: getStripe as never,
    isStripeConfigured,
    appUrl: () => process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    getWorkspaceCookieId: () => workspaceFromCookie(request),
  })(request);
}
