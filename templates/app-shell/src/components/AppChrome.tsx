"use client";

import {
  AppShellNav,
  defaultAppNavSections,
  type ShellNavUser,
} from "@llanesleonardo/saas-product-shell/ui";

type Props = {
  brandName: string;
  user: ShellNavUser | null;
};

export function AppChrome({ brandName, user }: Props) {
  return (
    <AppShellNav
      brand={{ name: brandName, href: "/product" }}
      sections={defaultAppNavSections()}
      workspacesEnabled
      user={user}
      workspaceSwitcher={{ cookieName: "shell_workspace" }}
    />
  );
}
