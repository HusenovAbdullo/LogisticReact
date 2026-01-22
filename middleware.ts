import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // faqat dashboard guruhini himoyalaymiz
  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/orders") ||
    pathname.startsWith("/warehouse") ||
    pathname.startsWith("/couriers");

  if (!isProtected) return NextResponse.next();

  const access = req.cookies.get("sp_token")?.value;

  if (!access) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/orders/:path*", "/warehouse/:path*", "/couriers/:path*"],
};
