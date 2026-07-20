export default function ProductRulesPage() {
  return (
    <div>
      <p
        style={{
          margin: 0,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--muted)",
        }}
      >
        Product · placeholder
      </p>
      <h1 style={{ margin: "0.35rem 0 0.75rem", fontSize: "1.5rem" }}>Rules</h1>
      <p style={{ margin: 0, lineHeight: 1.55, color: "var(--muted)", maxWidth: "40rem" }}>
        Placeholder for policies, automation rules, or workflow config. Domain-specific —
        keep Workspace/Account chrome unchanged.
      </p>
    </div>
  );
}
