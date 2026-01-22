// src/app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthCookieName } from "@/shared/config/env.server";

export const dynamic = "force-dynamic";

function cookieBase() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
  };
}

export async function POST() {
  const c = await cookies();
  const AUTH_COOKIE_NAME = getAuthCookieName();

  // access token cookie
  c.set(AUTH_COOKIE_NAME, "", { ...cookieBase(), maxAge: 0 });

  // refresh token cookie
  c.set("refresh_token", "", { ...cookieBase(), maxAge: 0 });

  // optional meta
  c.set("shop_owner", "", { ...cookieBase(), maxAge: 0 });
  c.set("role", "", { ...cookieBase(), maxAge: 0 });

  return NextResponse.json({ ok: true }, { status: 200 });
}
