// src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL;

type BackendLoginResponse = {
  refresh: string;
  access: string;
  shop_owner: boolean;
};

function cleanBaseUrl(u: string) {
  return u.replace(/\/$/, "");
}

export async function POST(req: Request) {
  try {
    if (!BACKEND_URL) {
      return NextResponse.json(
        { error: "BACKEND_URL (yoki API_BASE_URL) o'rnatilmagan" },
        { status: 500 },
      );
    }

    const body = await req.json().catch(() => null);
    const login = body?.login;
    const password = body?.password;

    if (!login || !password) {
      return NextResponse.json(
        { error: "Login va parol majburiy" },
        { status: 400 },
      );
    }

    // Siz aytgan endpoint:
    const url = `${cleanBaseUrl(BACKEND_URL)}/api/v1/admin/auth/login/`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({ login, password }),
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("Login backend failed:", res.status, text);

      if (res.status === 401 || res.status === 403) {
        return NextResponse.json(
          { error: "Login yoki parol noto‘g‘ri" },
          { status: 401 },
        );
      }

      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    const data = (await res.json()) as BackendLoginResponse;

    if (!data?.access || !data?.refresh) {
      console.error("Login backend invalid payload:", data);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    const isProd = process.env.NODE_ENV === "production";

    // MUHIM: http.ts auth:true tokenni shu cookie nomidan oladi
    const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE ?? "sp_token";


    // Next 16 da cookies() async bo‘lishi mumkin
    const c = await cookies();

    // ✅ access token (asosiy)
    c.set(AUTH_COOKIE_NAME, data.access, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      // access token TTL backendnikiga mos bo'lgani yaxshi (hozir 1 soat qoldirdim)
      maxAge: 60 * 60,
    });

    // ✅ refresh token (uzoq)
    c.set("refresh_token", data.refresh, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    // role / shop_owner (ixtiyoriy)
    c.set("shop_owner", String(Boolean(data.shop_owner)), {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    c.set("role", data.shop_owner ? "shop" : "admin", {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return NextResponse.json(
      { ok: true, shop_owner: Boolean(data.shop_owner) },
      { status: 200 },
    );
  } catch (e) {
    console.error("Login route error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
