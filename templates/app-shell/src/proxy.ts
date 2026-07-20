import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  DEFAULT_SESSION_COOKIE,
  isShellPublicPath,
} from "@llanesleonardo/saas-product-shell/middleware";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (
    pathname === "/" ||
    pathname === "/pricing" ||
    isShellPublicPath(pathname)
  ) {
    return NextResponse.next();
  }
  const session = request.cookies.get(DEFAULT_SESSION_COOKIE)?.value;
  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
