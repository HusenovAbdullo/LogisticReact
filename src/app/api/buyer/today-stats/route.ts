import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/lib/auth";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL;

function cleanBaseUrl(u: string) {
  return u.replace(/\/$/, "");
}

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? "";

  if (!BACKEND_URL) {
    return NextResponse.json(
      { error: "BACKEND_URL o'rnatilmagan" },
      { status: 500 }
    );
  }

  const c = await cookies();
  const token = c.get(AUTH_COOKIE_NAME)?.value;

  // DIAGNOSTIKA: token yo'q bo'lsa - qaysi cookie nomlari kelganini ko'rsatamiz
  if (!token) {
    return NextResponse.json(
      {
        message: "Not authenticated",
        missingCookie: AUTH_COOKIE_NAME,
        availableCookies: c.getAll().map((x) => x.name),
      },
      { status: 401 }
    );
  }

  // Siz bergan curl endpoint shu:
  const url = `${cleanBaseUrl(BACKEND_URL)}/api/v1/admin/orders/today-stats/?date=${encodeURIComponent(date)}`;

  const upstream = await fetch(url, {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  const text = await upstream.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  return NextResponse.json(data, { status: upstream.status });
}
