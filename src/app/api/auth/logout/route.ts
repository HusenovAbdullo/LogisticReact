import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, REFRESH_COOKIE_NAME } from "@/lib/auth";
import { appendLog } from "@/lib/request-logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SameSite = "lax" | "strict" | "none";

function cookieBase(opts?: { maxAge?: number; sameSite?: SameSite }) {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true as const,
    secure: isProd,
    sameSite: (opts?.sameSite ?? "lax") as SameSite,
    path: "/" as const,
    ...(typeof opts?.maxAge === "number" ? { maxAge: opts.maxAge } : {}),
  };
}

function maskReqHeaders(h: Headers) {
  const out: Record<string, string> = {};
  for (const [k, v] of h.entries()) {
    const key = k.toLowerCase();
    if (key === "authorization") out[k] = "Bearer ***";
    else if (key === "cookie") out[k] = "***";
    else out[k] = v;
  }
  return out;
}

export async function POST(req: Request) {
  const start = Date.now();
  const c = await cookies();

  // 1) delete
  try {
    c.delete(AUTH_COOKIE_NAME);
    c.delete(REFRESH_COOKIE_NAME);
    c.delete("shop_owner");
    c.delete("role");
  } catch {}

  // 2) overwrite
  c.set(AUTH_COOKIE_NAME, "", cookieBase({ maxAge: 0 }));
  c.set(REFRESH_COOKIE_NAME, "", cookieBase({ maxAge: 0 }));
  c.set("shop_owner", "", cookieBase({ maxAge: 0 }));
  c.set("role", "", cookieBase({ maxAge: 0 }));

  appendLog({
    direction: "incoming",
    method: "POST",
    url: "/api/auth/logout",
    status: 200,
    duration_ms: Date.now() - start,
    reqHeaders: maskReqHeaders(req.headers),
    resBody: { ok: true },
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
