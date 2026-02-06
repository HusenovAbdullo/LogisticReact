// src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBackendUrl, getAuthCookieName } from "@/shared/config/env.server";

export const dynamic = "force-dynamic";

type BackendLoginResponse = {
  refresh: string;
  access: string;
  shop_owner: boolean;
};

function cookieBase() {
  // const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: false,
    sameSite: "lax" as const,
    path: "/",
  };
}

export async function POST(req: Request) {
  try {
    const base = getBackendUrl(); // ✅ faqat server env (no NEXT_PUBLIC_*)
    const body = await req.json().catch(() => null);

    const login = typeof body?.login === "string" ? body.login.trim() : "";
    const password =
      typeof body?.password === "string" ? body.password.trim() : "";

    if (!login || !password) {
      return NextResponse.json(
        { error: "Login va parol majburiy" },
        { status: 400 }
      );
    }

    const url = `${base}/api/v1/admin/auth/login/`;

    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({ login, password }),
      cache: "no-store",
    });

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => "");
      console.error("Login backend failed:", upstream.status, text);

      if (upstream.status === 401 || upstream.status === 403) {
        return NextResponse.json(
          { error: "Login yoki parol noto‘g‘ri" },
          { status: 401 }
        );
      }

      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    const data = (await upstream.json()) as Partial<BackendLoginResponse>;

    if (!data?.access || !data?.refresh) {
      console.error("Login backend invalid payload:", data);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    const AUTH_COOKIE_NAME = getAuthCookieName();
    const c = await cookies();

    // ✅ access token (asosiy)
    c.set(AUTH_COOKIE_NAME, data.access, {
      ...cookieBase(),
      maxAge: 60 * 60, // 1 soat (backendga moslashtiring)
    });

    // ✅ refresh token (uzoq)
    c.set("refresh_token", data.refresh, {
      ...cookieBase(),
      maxAge: 60 * 60 * 24 * 30, // 30 kun
    });

    // ✅ optional meta
    const shopOwner = Boolean(data.shop_owner);

    c.set("shop_owner", String(shopOwner), {
      ...cookieBase(),
      maxAge: 60 * 60 * 24 * 30,
    });

    c.set("role", shopOwner ? "shop" : "admin", {
      ...cookieBase(),
      maxAge: 60 * 60 * 24 * 30,
    });

    return NextResponse.json(
      { ok: true, shop_owner: shopOwner },
      { status: 200 }
    );
  } catch (e) {
    console.error("Login route error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
