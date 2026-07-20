"use client";

import { useEffect, useState } from "react";

type Workspace = { id: string; name: string; slug: string; plan?: string };

export default function WorkspaceSettingsPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/workspaces");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to load");
        return;
      }
      setWorkspaces(data.workspaces ?? []);
    })();
  }, []);

  return (
    <div>
      <h1>Workspace</h1>
      <p style={{ color: "var(--muted)", lineHeight: 1.5 }}>
        Active workspace is controlled from the sidebar switcher. Create more under
        Onboarding (selfhosted: departments like Marketing / Sales).
      </p>
      {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
      <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.5rem" }}>
        {workspaces.map((w) => (
          <li
            key={w.id}
            style={{
              padding: "0.75rem 1rem",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--surface)",
            }}
          >
            <strong>{w.name}</strong>{" "}
            <span style={{ color: "var(--muted)" }}>({w.slug})</span>
          </li>
        ))}
      </ul>
      <p style={{ marginTop: "1rem" }}>
        <a href="/onboarding">Create another workspace</a>
      </p>
    </div>
  );
}
