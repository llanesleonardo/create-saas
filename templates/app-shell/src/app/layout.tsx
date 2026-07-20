export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "Georgia, 'Times New Roman', serif",
          background: "linear-gradient(160deg, #e8f0e6 0%, #f7f3ea 45%, #d9e4f0 100%)",
          minHeight: "100vh",
          color: "#1a2a1f",
        }}
      >
        <header
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid rgba(26,42,31,0.12)",
          }}
        >
          <a href="/" style={{ color: "inherit", textDecoration: "none", fontSize: "1.35rem" }}>
            ShellDemo
          </a>
          <nav style={{ display: "inline-flex", gap: "1rem", marginLeft: "1.5rem", fontSize: "0.95rem" }}>
            <a href="/workspaces">Workspaces</a>
            <a href="/onboarding">Onboarding</a>
            <a href="/account">Account</a>
            <a href="/login">Login</a>
          </nav>
        </header>
        <main style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1.25rem" }}>{children}</main>
      </body>
    </html>
  );
}
