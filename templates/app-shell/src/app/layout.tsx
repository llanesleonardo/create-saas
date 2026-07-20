import type { Metadata } from "next";
import { themeBootstrapScript } from "@llanesleonardo/saas-product-shell/ui/theme-bootstrap";
import { AppProviders } from "@/components/AppProviders";
import { AppChrome } from "@/components/AppChrome";
import { getCurrentUser } from "@/lib/current-user";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShellDemo",
  description: "SaaS product shell — dual-mode tenancy starter",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: themeBootstrapScript() }}
        />
      </head>
      <body>
        <AppProviders>
          <div
            style={{
              display: "flex",
              minHeight: "100vh",
              flexDirection: "column",
            }}
            className="shell-root"
          >
            <div
              style={{ display: "flex", flex: 1, minHeight: 0, flexDirection: "column" }}
              className="shell-row"
            >
              <AppChrome brandName="ShellDemo" user={user} />
              <main className="shell-main">{children}</main>
            </div>
          </div>
        </AppProviders>
        <style>{`
          @media (min-width: 768px) {
            .shell-row { flex-direction: row !important; }
          }
        `}</style>
      </body>
    </html>
  );
}
