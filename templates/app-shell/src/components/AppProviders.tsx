"use client";

import { ThemeProvider } from "@llanesleonardo/saas-product-shell/ui";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
