"use client";

import { useEffect, useState } from "react";

type Member = {
  user_id: string;
  email?: string;
  role: string;
};

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/workspaces/members");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to load members");
        return;
      }
      setMembers(data.members ?? []);
    })();
  }, []);

  return (
    <div>
      <h1>Members</h1>
      <p style={{ opacity: 0.8 }}>
        Workspace members (both saas and selfhosted). Invite flows are product-specific —
        wire invites to platform <code>createWorkspaceInvite</code>.
      </p>
      {error && <p style={{ color: "#8b1a1a" }}>{error}</p>}
      <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.5rem" }}>
        {members.map((m) => (
          <li
            key={m.user_id}
            style={{
              padding: "0.65rem 0.85rem",
              background: "rgba(255,255,255,0.55)",
              border: "1px solid rgba(26,42,31,0.12)",
            }}
          >
            {m.email ?? m.user_id}{" "}
            <span style={{ opacity: 0.7 }}>({m.role})</span>
          </li>
        ))}
      </ul>
      {members.length === 0 && !error && <p>No members yet.</p>}
    </div>
  );
}
