import {
  createShellRegistration,
  getShellDb,
  DEFAULT_SESSION_COOKIE,
} from "@llanesleonardo/saas-product-shell";

const { ensureRegistered } = createShellRegistration({
  productName: "ShellDemo",
  apiKeyPrefix: "shell_",
  workspaceCookieName: "shell_workspace",
  scopes: ["demo:read", "demo:write"],
  features: ["demo"],
  quotas: ["max_seats"],
  metrics: ["actions"],
});

ensureRegistered();

export function getDb() {
  // Demo default: memory (clean dogfood). Set DATABASE_PROVIDER=sqlite to persist.
  const provider =
    (process.env.DATABASE_PROVIDER as "memory" | "sqlite" | undefined) ?? "memory";
  return getShellDb({
    provider,
    // SaaS owned-cap; selfhosted create handler uses createWorkspace (unlimited).
    maxOwnedWorkspacesPerUser: 5,
  });
}

export function getSessionIdFromCookieHeader(cookieHeader: string | null): string | undefined {
  if (!cookieHeader) return undefined;
  const name = DEFAULT_SESSION_COOKIE;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : undefined;
}

export function authDeps(request: Request) {
  return {
    getDb,
    sessionCookieName: DEFAULT_SESSION_COOKIE,
    getSessionId: () => getSessionIdFromCookieHeader(request.headers.get("cookie")),
  };
}
