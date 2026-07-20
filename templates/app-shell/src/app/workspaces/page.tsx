"use client";

import { useEffect, useState } from "react";

type Workspace = { id: string; name: string; slug: string; plan: string };

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/workspaces");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to load");
      return;
    }
    setWorkspaces(data.workspaces ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function switchTo(workspaceId: string) {
    setError(null);
    const res = await fetch("/api/workspaces/active", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ workspaceId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Switch failed");
      return;
    }
    setActive(workspaceId);
  }

  return (
    <div>
      <h1>Workspaces (T-02)</h1>
      <p style={{ opacity: 0.8 }}>
        Active cookie: {active ?? "(set by switch)"} ·{" "}
        <a href="/onboarding">Create another</a>
      </p>
      {error && <p style={{ color: "#8b1a1a" }}>{error}</p>}
      <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.75rem" }}>
        {workspaces.map((w) => (
          <li
            key={w.id}
            style={{
              padding: "0.75rem 1rem",
              background: "rgba(255,255,255,0.55)",
              border: "1px solid rgba(26,42,31,0.12)",
            }}
          >
            <strong>{w.name}</strong> <span style={{ opacity: 0.7 }}>({w.slug})</span>
            <button
              type="button"
              onClick={() => void switchTo(w.id)}
              style={{ marginLeft: "1rem", padding: "0.35rem 0.75rem" }}
            >
              Switch
            </button>
          </li>
        ))}
      </ul>
      {workspaces.length === 0 && <p>No workspaces yet.</p>}
    </div>
  );
}
