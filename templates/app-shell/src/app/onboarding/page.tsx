"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not create workspace");
      return;
    }
    router.push("/workspaces");
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: "0.75rem" }}>
      <h1>Onboarding (T-02)</h1>
      <p style={{ opacity: 0.8 }}>Create your first workspace.</p>
      <label>
        Workspace name
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{ display: "block", width: "100%", padding: "0.5rem" }}
        />
      </label>
      {error && <p style={{ color: "#8b1a1a" }}>{error}</p>}
      <button type="submit" style={{ padding: "0.6rem 1rem" }}>
        Create workspace
      </button>
    </form>
  );
}
