"use client";

import { useEffect, useState } from "react";

export default function AccountPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (res.ok) setEmail(data.user?.email ?? null);
    })();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const res = await fetch("/api/auth/password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Password change failed");
      return;
    }
    setMessage("Password updated; sessions rotated.");
    setCurrent("");
    setNew("");
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div>
      <h1>Account (T-05)</h1>
      <p style={{ opacity: 0.8 }}>Signed in as {email ?? "…"}</p>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: "0.75rem", marginTop: "1rem" }}>
        <label>
          Current password
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrent(e.target.value)}
            required
            style={{ display: "block", width: "100%", padding: "0.5rem" }}
          />
        </label>
        <label>
          New password
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNew(e.target.value)}
            required
            minLength={8}
            style={{ display: "block", width: "100%", padding: "0.5rem" }}
          />
        </label>
        {error && <p style={{ color: "#8b1a1a" }}>{error}</p>}
        {message && <p style={{ color: "#1a5c2e" }}>{message}</p>}
        <button type="submit" style={{ padding: "0.6rem 1rem" }}>
          Change password
        </button>
      </form>
      <button type="button" onClick={() => void logout()} style={{ marginTop: "1.5rem" }}>
        Log out
      </button>
    </div>
  );
}
