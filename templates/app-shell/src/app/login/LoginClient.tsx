"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginClient() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Login failed");
      return;
    }
    const next = search.get("next");
    router.push(next && next.startsWith("/") ? next : "/workspaces");
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: "0.75rem" }}>
      <h1>Login (T-01)</h1>
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
        Password
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
          style={{ display: "block", width: "100%", padding: "0.5rem" }}
        />
      </label>
      {error && <p style={{ color: "#8b1a1a" }}>{error}</p>}
      <button type="submit" style={{ padding: "0.6rem 1rem" }}>
        Sign in
      </button>
      <p>
        Need first user? <a href="/setup">Setup</a>
      </p>
    </form>
  );
}
