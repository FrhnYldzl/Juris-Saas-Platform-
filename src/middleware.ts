import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

const PUBLIC_PATHS = [
  "/", "/login", "/register", "/forgot-password",
  "/kvkk", "/gizlilik", "/iletisim",
  "/api/auth", "/api/health",
];
const PUBLIC_ASSETS = ["/_next", "/favicon.ico", "/brand", "/fonts", "/robots.txt", "/sitemap.xml"];

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_ASSETS.some((p) => pathname.startsWith(p))) return NextResponse.next();
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  const session = await auth();
  if (!session?.user) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Client role → redirect everything to /portal
  if (session.user.role === "CLIENT" && !pathname.startsWith("/portal")) {
    const url = req.nextUrl.clone();
    url.pathname = "/portal";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
