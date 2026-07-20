import { getDb } from "@/lib/shell";
import {
  createStripeWebhookHandler,
  DEMO_PLAN_CATALOG,
  planIdFromStripePriceId,
} from "@llanesleonardo/saas-product-shell";

function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

function getStripe() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Stripe = require("stripe") as typeof import("stripe").default;
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

export async function POST(request: Request) {
  return createStripeWebhookHandler({
    getDb,
    getStripe: getStripe as never,
    isStripeConfigured,
    planFromPriceId: (priceId) => planIdFromStripePriceId(DEMO_PLAN_CATALOG, priceId),
    isPaidPlan: (plan) => plan === "pro" || plan === "business",
    defaultPlanId: "free",
  })(request);
}
