"use client";

import { useMemo, useState } from "react";
import { DEMO_PLAN_CATALOG } from "@llanesleonardo/saas-product-shell/billing";

export default function PricingPage() {
  const plans = useMemo(() => DEMO_PLAN_CATALOG.plans, []);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function checkout(planId: string) {
    setError(null);
    setMessage(null);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ plan: planId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Checkout unavailable (configure STRIPE_SECRET_KEY + price env vars)");
      return;
    }
    if (data.url) {
      window.location.href = data.url;
      return;
    }
    setMessage("Checkout session created (no URL).");
  }

  return (
    <div>
      <h1>Pricing (T-03 / T-04)</h1>
      <p style={{ opacity: 0.85, lineHeight: 1.5 }}>
        Catalog from <code>DEMO_PLAN_CATALOG</code>. Checkout uses shell kit handlers when Stripe is
        configured.
      </p>
      {error && <p style={{ color: "#8b1a1a" }}>{error}</p>}
      {message && <p style={{ color: "#1a5c2e" }}>{message}</p>}
      <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "1rem" }}>
        {plans.map((p) => (
          <li
            key={p.id}
            style={{
              padding: "1rem",
              background: "rgba(255,255,255,0.55)",
              border: "1px solid rgba(26,42,31,0.12)",
            }}
          >
            <strong>{p.name}</strong>{" "}
            <span style={{ opacity: 0.75 }}>{p.displayPrice ?? ""}</span>
            <div style={{ fontSize: "0.9rem", marginTop: "0.5rem", opacity: 0.8 }}>
              Features: {Object.keys(p.features).filter((k) => p.features[k]).join(", ") || "—"}
            </div>
            {p.stripePriceEnvKey ? (
              <button
                type="button"
                onClick={() => void checkout(p.id)}
                style={{ marginTop: "0.75rem", padding: "0.45rem 0.9rem" }}
              >
                Checkout {p.id}
              </button>
            ) : (
              <p style={{ marginTop: "0.75rem", opacity: 0.7 }}>Included free</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
