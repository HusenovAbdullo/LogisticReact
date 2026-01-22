// src/app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, REFRESH_COOKIE_NAME } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type SameSite = "lax" | "strict" | "none";

function cookieBase(opts?: { maxAge?: number; sameSite?: SameSite }) {
  const isProd = process.env.NODE_ENV === "production";
  const maxAge = opts?.maxAge;

  // maxAge=0 bo‘lsa expires ham qo‘shamiz (ba’zi client’larda ishonchliroq)
  const expires =
    typeof maxAge === "number" && maxAge <= 0 ? new Date(0) : undefined;

  return {
    httpOnly: true as const,
    secure: isProd,
    sameSite: (opts?.sameSite ?? "lax") as SameSite,
    path: "/" as const,
    ...(typeof maxAge === "number" ? { maxAge } : {}),
    ...(expires ? { expires } : {}),
  };
}

function clearCookie(c: Awaited<ReturnType<typeof cookies>>, name: string) {
  // 1) delete (tezkor)
  try {
    c.delete(name);
  } catch {
    // ignore
  }
  // 2) overwrite (ishonchli)
  c.set(name, "", cookieBase({ maxAge: 0 }));
}

export async function POST() {
  const c = await cookies();

  // tokenlar
  clearCookie(c, AUTH_COOKIE_NAME);
  clearCookie(c, REFRESH_COOKIE_NAME);

  // meta (ixtiyoriy)
  clearCookie(c, "shop_owner");
  clearCookie(c, "role");

  return NextResponse.json({ ok: true }, { status: 200 });
}
