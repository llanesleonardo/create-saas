"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SetupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/auth/setup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      const already = data?.details?.includes?.("SETUP_ALREADY_DONE");
      setError(
        already
          ? "Setup already completed — use Log In instead."
          : (data.error ?? "Setup failed"),
      );
      return;
    }
    router.push("/onboarding");
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: "0.75rem" }}>
      <h1>Create admin</h1>
      <p style={{ opacity: 0.8 }}>Create the first (and only) super admin.</p>
      <label>
        Email
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
          style={{ display: "block", width: "100%", padding: "0.5rem" }}
        />
      </label>
      <label>
        Password (min 8)
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
          minLength={8}
          style={{ display: "block", width: "100%", padding: "0.5rem" }}
        />
      </label>
      {error && (
        <p style={{ color: "#8b1a1a" }}>
          {error}{" "}
          {error.includes("Log In") && <a href="/login">Go to Log In</a>}
        </p>
      )}
      <button type="submit" style={{ padding: "0.6rem 1rem" }}>
        Create admin
      </button>
      <p>
        Already set up? <a href="/login">Log In</a>
      </p>
    </form>
  );
}
