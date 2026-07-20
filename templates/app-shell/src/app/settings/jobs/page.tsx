export default function JobsPage() {
  return (
    <div>
      <h1>Jobs</h1>
      <p style={{ color: "var(--muted)", lineHeight: 1.55, maxWidth: "40rem" }}>
        Background job UI is product-specific (outbox worker). This page is a standard Account
        nav slot — wire your jobs list / retry API here.
      </p>
    </div>
  );
}
