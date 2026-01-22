import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, clearAuthCookiesSSR, getAccessTokenSSR, refreshAccessTokenSSR } from "@/lib/auth";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL;

function cleanBaseUrl(u: string) {
  return u.replace(/\/$/, "");
}

export const dynamic = "force-dynamic";

async function fetchTodayStats(date: string, token: string) {
  const url = `${cleanBaseUrl(BACKEND_URL!)}/api/v1/admin/orders/today-stats/?date=${encodeURIComponent(date)}`;

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
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  return { status: upstream.status, data };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? "";

  if (!BACKEND_URL) {
    return NextResponse.json(
      { error: "BACKEND_URL o'rnatilmagan" },
      { status: 500 },
    );
  }

  // 1) access token
  let token = await getAccessTokenSSR();

  if (!token) {
    return NextResponse.json(
      {
        message: "Not authenticated",
        missingCookie: AUTH_COOKIE_NAME,
      },
      { status: 401 },
    );
  }

  // 2) birinchi urinish
  let result = await fetchTodayStats(date, token);

  // 3) 401 bo‘lsa: refresh + retry (1 marta)
  if (result.status === 401) {
    const newToken = await refreshAccessTokenSSR();

    if (newToken) {
      token = newToken;
      result = await fetchTodayStats(date, token);
    } else {
      // refresh ham bo‘lmasa — cookie’larni tozalab yuboramiz
      await clearAuthCookiesSSR();
    }
  }

  return NextResponse.json(result.data, { status: result.status });
}
