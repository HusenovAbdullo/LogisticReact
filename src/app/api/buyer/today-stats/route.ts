// src/app/api/buyer/today-stats/route.ts
import { NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  clearAuthCookiesSSR,
  getAccessTokenSSR,
  refreshAccessTokenSSR,
} from "@/lib/auth";
import { appendLog } from "@/lib/request-logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================
 * Env
 * ========================= */
const RAW_BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "";

function cleanBaseUrl(u: string) {
  return (u || "").replace(/\/+$/, "");
}

const BACKEND_URL = RAW_BACKEND_URL ? cleanBaseUrl(RAW_BACKEND_URL) : "";

/* =========================
 * Helpers
 * ========================= */
function safeParse(text: string) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function buildUpstreamUrl(date: string) {
  const qs = new URLSearchParams();
  if (date) qs.set("date", date);
  // agar date bo‘sh bo‘lsa ham endpoint ishlashi mumkin
  const q = qs.toString();
  return `${BACKEND_URL}/api/v1/admin/orders/today-stats/${q ? `?${q}` : ""}`;
}

function maskHeadersForLog(h: HeadersInit) {
  const H = new Headers(h);
  const out: Record<string, string> = {};
  for (const [k, v] of H.entries()) {
    const key = k.toLowerCase();
    if (key === "authorization") out[k] = "Bearer ***";
    else if (key === "cookie") out[k] = "***";
    else out[k] = v;
  }
  return out;
}

async function fetchTodayStats(date: string, token: string) {
  const url = buildUpstreamUrl(date);
  const start = Date.now();

  const reqHeaders: HeadersInit = {
    accept: "application/json",
    Authorization: `Bearer ${token}`,
  };

  try {
    const upstream = await fetch(url, {
      method: "GET",
      headers: reqHeaders,
      cache: "no-store",
    });

    const text = await upstream.text().catch(() => "");
    const data = safeParse(text);

    // OUTGOING log (backend)
    appendLog({
      direction: "outgoing",
      method: "GET",
      url,
      status: upstream.status,
      duration_ms: Date.now() - start,
      reqHeaders: maskHeadersForLog(reqHeaders),
      resHeaders: Object.fromEntries(upstream.headers.entries()),
      resBody: data,
    });

    return { status: upstream.status, data };
  } catch (e: any) {
    // OUTGOING log (fetch error)
    appendLog({
      direction: "outgoing",
      method: "GET",
      url,
      status: 0,
      duration_ms: Date.now() - start,
      reqHeaders: maskHeadersForLog(reqHeaders),
      error: e?.message ?? "fetch_failed",
    });

    throw e;
  }
}

/* =========================
 * Route
 * ========================= */
export async function GET(req: Request) {
  const start = Date.now();
  const { searchParams } = new URL(req.url);
  const date = (searchParams.get("date") ?? "").trim();

  const internalUrl = `/api/buyer/today-stats${date ? `?date=${encodeURIComponent(date)}` : ""}`;

  if (!BACKEND_URL) {
    appendLog({
      direction: "incoming",
      method: "GET",
      url: internalUrl,
      status: 500,
      duration_ms: Date.now() - start,
      reqHeaders: maskHeadersForLog(req.headers),
      error: "BACKEND_URL not set",
    });

    return NextResponse.json({ error: "BACKEND_URL o'rnatilmagan" }, { status: 500 });
  }

  // 1) access token
  let token = await getAccessTokenSSR();
  if (!token) {
    appendLog({
      direction: "incoming",
      method: "GET",
      url: internalUrl,
      status: 401,
      duration_ms: Date.now() - start,
      reqHeaders: maskHeadersForLog(req.headers),
      error: "Not authenticated (missing access cookie)",
      resBody: { missingCookie: AUTH_COOKIE_NAME },
    });

    return NextResponse.json(
      { message: "Not authenticated", missingCookie: AUTH_COOKIE_NAME },
      { status: 401 },
    );
  }

  // 2) first attempt
  let result: { status: number; data: any };
  try {
    result = await fetchTodayStats(date, token);
  } catch (e: any) {
    appendLog({
      direction: "incoming",
      method: "GET",
      url: internalUrl,
      status: 502,
      duration_ms: Date.now() - start,
      reqHeaders: maskHeadersForLog(req.headers),
      error: e?.message ?? "backend_unreachable",
    });

    return NextResponse.json(
      { error: "Backend bilan ulanishda xatolik", detail: e?.message ?? null },
      { status: 502 },
    );
  }

  // 3) 401 -> refresh + retry (once)
  if (result.status === 401) {
    const newToken = await refreshAccessTokenSSR();

    if (newToken) {
      token = newToken;
      try {
        result = await fetchTodayStats(date, token);
      } catch (e: any) {
        appendLog({
          direction: "incoming",
          method: "GET",
          url: internalUrl,
          status: 502,
          duration_ms: Date.now() - start,
          reqHeaders: maskHeadersForLog(req.headers),
          error: e?.message ?? "backend_unreachable_after_refresh",
        });

        return NextResponse.json(
          { error: "Backend bilan ulanishda xatolik", detail: e?.message ?? null },
          { status: 502 },
        );
      }
    } else {
      await clearAuthCookiesSSR();
    }
  }

  // INCOMING log (final response)
  appendLog({
    direction: "incoming",
    method: "GET",
    url: internalUrl,
    status: result.status,
    duration_ms: Date.now() - start,
    reqHeaders: maskHeadersForLog(req.headers),
    resBody: result.data,
  });

  return NextResponse.json(result.data, { status: result.status });
}
