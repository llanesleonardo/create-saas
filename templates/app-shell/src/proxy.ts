import {
  createShellProxy,
  DEFAULT_SESSION_COOKIE,
} from "@llanesleonardo/saas-product-shell/middleware";
import { resolveSessionUser } from "@llanesleonardo/saas-product-shell/auth";
import { getDb } from "@/lib/shell";

/**
 * Dual-mode standards (shell docs/DUAL-MODE-TENANCY.md):
 * - One super admin (requireFirstAdmin)
 * - Workspace required after login (requireWorkspace)
 */
export const proxy = createShellProxy({
  publicExact: ["/", "/pricing"],
  sessionCookieName: DEFAULT_SESSION_COOKIE,
  loginPath: "/login",
  requireFirstAdmin: { getDb },
  requireWorkspace: {
    getDb,
    resolveUserId: async (sessionId) => {
      const user = await resolveSessionUser(getDb(), sessionId);
      return user?.id ?? null;
    },
    onboardingPath: "/onboarding",
    exemptExact: ["/account"],
    exemptPrefixes: [],
  },
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
