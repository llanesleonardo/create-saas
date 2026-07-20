"use client";

import { ApiKeysPanel } from "@llanesleonardo/saas-product-shell/api-keys/ui";

export default function ApiKeysPage() {
  return (
    <div>
      <h1>API keys</h1>
      <ApiKeysPanel
        description="Issue workspace-scoped keys (available in saas and selfhosted)."
        prefixHint="shell_"
      />
    </div>
  );
}
