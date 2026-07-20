"use client";

import { useEffect, useState } from "react";

type SessionRow = {
  id: string;
  created_at: string;
  last_seen_at: string | null;
  current?: boolean;
};

export default function SecurityPage() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/auth/sessions");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to load sessions");
      return;
    }
    setSessions(data.sessions ?? []);
    setNote(data.note ?? null);
  }

  useEffect(() => {
    void load();
  }, []);

  async function revoke(sessionId: string) {
    const res = await fetch("/api/auth/sessions", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Revoke failed");
      return;
    }
    await load();
  }

  return (
    <div>
      <h1>Security</h1>
      <p style={{ color: "var(--muted)" }}>Signed-in devices for this account.</p>
      {note && <p style={{ fontSize: 13, color: "var(--muted)" }}>{note}</p>}
      {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
      <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.5rem" }}>
        {sessions.map((s) => (
          <li
            key={s.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "1rem",
              padding: "0.75rem 1rem",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--surface)",
            }}
          >
            <span style={{ fontSize: 13 }}>
              {s.current ? "This device · " : ""}
              {s.last_seen_at ?? s.created_at}
            </span>
            {!s.current ? (
              <button type="button" onClick={() => void revoke(s.id)}>
                Revoke
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
