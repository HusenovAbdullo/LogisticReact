import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthCookieName } from "@/shared/config/env.server";

export function middleware(req: NextRequest) {
  console.log("Cookies incoming:", req.cookies.getAll());
  const { pathname } = req.nextUrl;

  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/orders") ||
    pathname.startsWith("/warehouse") ||
    pathname.startsWith("/couriers");

  if (!isProtected) return NextResponse.next();

  const AUTH_COOKIE = getAuthCookieName(); // 🔥 ASOSIY FIX
  const access = req.cookies.get(AUTH_COOKIE)?.value;

  if (!access) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/orders/:path*",
    "/warehouse/:path*",
    "/couriers/:path*",
  ],
};
