"use client";

import { useEffect, useState } from "react";

export default function HomePage() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/auth/me");
      setSignedIn(res.ok);
    })();
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>ShellDemo</h1>
      <p style={{ lineHeight: 1.5, opacity: 0.85 }}>
        Epic 12 product-shell kits on <code>@llanesleonardo/saas-platform@0.2.1</code>.
        Default DB is <strong>memory</strong> (set <code>DATABASE_PROVIDER=sqlite</code> to persist).
      </p>
      {signedIn === true && (
        <p style={{ color: "#1a5c2e" }}>
          You are signed in · <a href="/workspaces">Workspaces</a> ·{" "}
          <a href="/account">Account</a>
        </p>
      )}
      {signedIn === false && (
        <p>
          Start here: <a href="/setup">Setup</a> (first admin) or <a href="/login">Login</a>
        </p>
      )}
      <ol style={{ lineHeight: 1.8 }}>
        <li>
          <a href="/setup">Setup</a> first admin (T-01)
        </li>
        <li>
          <a href="/login">Login</a>
        </li>
        <li>
          <a href="/onboarding">Create workspace</a> (T-02)
        </li>
        <li>
          <a href="/workspaces">Switch workspace</a>
        </li>
        <li>
          <a href="/account">Change password</a> (T-05)
        </li>
        <li>
          <a href="/pricing">Pricing / plans</a> (T-03)
        </li>
      </ol>
    </div>
  );
}
