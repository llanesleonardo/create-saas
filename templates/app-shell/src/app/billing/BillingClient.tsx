"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type PlanDef = {
  id: string;
  name: string;
  displayPrice?: string;
  features: Record<string, boolean>;
  quotas: Record<string, number>;
};

type BillingState = {
  mode: "saas" | "selfhosted";
  workspace: {
    id: string;
    name: string;
    plan: string;
    subscription_status: string | null;
    has_stripe_customer?: boolean;
  } | null;
  plan: PlanDef;
  catalog: { plans: PlanDef[]; defaultPlanId: string };
};

type InvoiceRow = {
  id: string;
  created: number;
  status: string | null;
  currency: string;
  amount_paid: number;
  amount_due: number;
  hosted_invoice_url: string | null;
  invoice_pdf: string | null;
  number: string | null;
};

function formatMoney(amountCents: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amountCents / 100);
  } catch {
    return `${(amountCents / 100).toFixed(2)} ${currency}`;
  }
}

export default function BillingClient() {
  const [state, setState] = useState<BillingState | null>(null);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/billing");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to load billing");
        return;
      }
      setState(await res.json());
      const inv = await fetch("/api/billing/invoices");
      if (inv.ok) {
        const body = (await inv.json()) as { invoices: InvoiceRow[] };
        setInvoices(body.invoices ?? []);
      }
    })();
  }, []);

  async function checkout(planId: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Checkout failed");
        return;
      }
      if (data.url) window.open(data.url, "_blank", "noopener,noreferrer");
    } finally {
      setBusy(false);
    }
  }

  async function openPortal() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Portal failed");
        return;
      }
      if (data.url) window.open(data.url, "_blank", "noopener,noreferrer");
    } finally {
      setBusy(false);
    }
  }

  if (!state && !error) {
    return <main style={{ padding: "2rem" }}>Loading…</main>;
  }

  const isSelfhosted = state?.mode === "selfhosted";
  const plans = state?.catalog.plans ?? [];
  const currentId = state?.workspace?.plan ?? state?.catalog.defaultPlanId;

  return (
    <main style={{ display: "grid", gap: "1.25rem" }}>
      <div>
        <h1 style={{ margin: 0 }}>Billing</h1>
        <p style={{ opacity: 0.8, marginTop: "0.35rem" }}>
          {isSelfhosted ? (
            <>
              Self-hosted license for{" "}
              <strong>{state?.workspace?.name ?? "…"}</strong>
            </>
          ) : (
            <>
              Plan and usage for <strong>{state?.workspace?.name ?? "…"}</strong>
            </>
          )}
        </p>
      </div>

      {isSelfhosted ? (
        <div
          style={{
            border: "1px solid rgba(26,42,31,0.2)",
            borderRadius: 8,
            padding: "0.85rem 1rem",
            background: "rgba(255,255,255,0.55)",
          }}
        >
          <strong>Self-hosted install</strong>
          <p style={{ margin: "0.35rem 0 0", opacity: 0.85, fontSize: "0.95rem" }}>
            Upgrades are handled offline — we send a Stripe payment link manually. Invoices
            appear here once the workspace is linked to a Stripe customer. No in-app checkout.
          </p>
        </div>
      ) : null}

      {error ? <p style={{ color: "#8b1a1a" }}>{error}</p> : null}

      <section
        style={{
          border: "1px solid rgba(26,42,31,0.15)",
          borderRadius: 8,
          padding: "1rem",
          background: "rgba(255,255,255,0.7)",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "0.75rem", letterSpacing: "0.06em", opacity: 0.7 }}>
          CURRENT PLAN
        </h2>
        <p style={{ margin: "0.5rem 0 0", fontSize: "1.15rem" }}>
          {state?.plan?.name ?? "—"}
          <span style={{ marginLeft: 8, fontSize: "0.9rem", opacity: 0.7 }}>
            ·{" "}
            {isSelfhosted
              ? state?.workspace?.has_stripe_customer
                ? "licensed"
                : "self-hosted"
              : (state?.workspace?.subscription_status ?? "none")}
          </span>
        </p>
      </section>

      <section
        style={{
          border: "1px solid rgba(26,42,31,0.15)",
          borderRadius: 8,
          overflow: "hidden",
          background: "rgba(255,255,255,0.7)",
        }}
      >
        <div style={{ padding: "0.85rem 1rem", borderBottom: "1px solid rgba(26,42,31,0.1)" }}>
          <h2 style={{ margin: 0, fontSize: "0.75rem", letterSpacing: "0.06em", opacity: 0.7 }}>
            FEATURE MATRIX
          </h2>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "0.6rem 1rem" }}>Feature</th>
                {plans.map((p) => (
                  <th key={p.id} style={{ textAlign: "left", padding: "0.6rem 1rem" }}>
                    {p.name}
                    {p.id === currentId ? " · current" : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: "0.5rem 1rem" }}>Price</td>
                {plans.map((p) => (
                  <td key={p.id} style={{ padding: "0.5rem 1rem" }}>
                    {p.displayPrice ?? "—"}
                  </td>
                ))}
              </tr>
              {(["demo", "api", "sso"] as const).map((feat) => (
                <tr key={feat}>
                  <td style={{ padding: "0.5rem 1rem" }}>{feat}</td>
                  {plans.map((p) => (
                    <td key={p.id} style={{ padding: "0.5rem 1rem" }}>
                      {p.features[feat] ? "Yes" : "—"}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td style={{ padding: "0.5rem 1rem" }}>Max seats</td>
                {plans.map((p) => (
                  <td key={p.id} style={{ padding: "0.5rem 1rem" }}>
                    {p.quotas.max_seats ?? "—"}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {isSelfhosted ? (
        <section
          style={{
            border: "1px dashed rgba(26,42,31,0.25)",
            borderRadius: 8,
            padding: "1rem",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "0.75rem", letterSpacing: "0.06em", opacity: 0.7 }}>
            UPGRADE / RENEW
          </h2>
          <p style={{ marginTop: "0.5rem", opacity: 0.85 }}>
            Contact your vendor for a Pro or Business license. They email a Stripe payment link —
            there is no in-app checkout on self-hosted.
          </p>
        </section>
      ) : (
        <section style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {plans
            .filter((p) => p.id !== "free" && p.id !== currentId)
            .map((p) => (
              <button
                key={p.id}
                type="button"
                disabled={busy}
                onClick={() => checkout(p.id)}
                style={{ padding: "0.55rem 0.9rem" }}
              >
                Upgrade to {p.name}
              </button>
            ))}
          <button
            type="button"
            disabled={busy}
            onClick={openPortal}
            style={{ padding: "0.55rem 0.9rem" }}
          >
            Open customer portal
          </button>
        </section>
      )}

      <section
        style={{
          border: "1px solid rgba(26,42,31,0.15)",
          borderRadius: 8,
          padding: "1rem",
          background: "rgba(255,255,255,0.7)",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "0.75rem", letterSpacing: "0.06em", opacity: 0.7 }}>
          INVOICES
        </h2>
        {isSelfhosted ? (
          <p style={{ marginTop: "0.5rem", opacity: 0.8, fontSize: "0.9rem" }}>
            Shown after a Stripe customer is linked to this workspace (manual payment link flow).
          </p>
        ) : null}
        {invoices.length === 0 ? (
          <p style={{ marginTop: "0.75rem", opacity: 0.75 }}>No invoices yet.</p>
        ) : (
          <table style={{ width: "100%", marginTop: "0.75rem", fontSize: "0.9rem" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Date</th>
                <th style={{ textAlign: "left" }}>Amount</th>
                <th style={{ textAlign: "left" }}>Status</th>
                <th style={{ textAlign: "left" }}>PDF</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td>
                    {new Date(inv.created * 1000).toLocaleDateString()}
                    {inv.number ? ` ${inv.number}` : ""}
                  </td>
                  <td>
                    {formatMoney(
                      inv.status === "paid" ? inv.amount_paid : inv.amount_due,
                      inv.currency,
                    )}
                  </td>
                  <td>{inv.status ?? "—"}</td>
                  <td>
                    {inv.invoice_pdf || inv.hosted_invoice_url ? (
                      <a
                        href={inv.invoice_pdf ?? inv.hosted_invoice_url ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <p>
        <Link href="/workspaces">Back to workspaces</Link>
      </p>
    </main>
  );
}
