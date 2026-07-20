function ProductPlaceholder({
  title,
  hint,
}: {
  title: string;
  hint: string;
}) {
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
      <h1 style={{ margin: "0.35rem 0 0.75rem", fontSize: "1.5rem" }}>{title}</h1>
      <p style={{ margin: 0, lineHeight: 1.55, color: "var(--muted)", maxWidth: 40 + "rem" }}>
        {hint} Replace this route with your domain UI when you know the product
        (forms, CRM, inventory, …). Workspace and Account nav stay the same for every
        product.
      </p>
    </div>
  );
}

export default function ProductOverviewPage() {
  return (
    <ProductPlaceholder
      title="Overview"
      hint="This is the default Product home after scaffold."
    />
  );
}
