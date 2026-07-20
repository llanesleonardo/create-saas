export default function DomainsPage() {
  return (
    <div>
      <h1>Domains</h1>
      <p style={{ opacity: 0.8 }}>
        Custom domains are product-specific (DNS verify, host rewrite). Keep this nav entry in
        both saas and selfhosted; implement against your domain tables / host proxy.
      </p>
      <p>
        See PeopleForms <code>/settings/domains</code> for a reference implementation — do not
        copy FormBuilder domain logic into the shell.
      </p>
    </div>
  );
}
