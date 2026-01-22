// src/app/api/buyer/today-stats/route.ts
import { NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  clearAuthCookiesSSR,
  getAccessTokenSSR,
  refreshAccessTokenSSR,
} from "@/lib/auth";
import { appendLog } from "@/lib/request-logger";
import { serverFetch } from "@/shared/api/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

export async function GET(req: Request) {
  const start = Date.now();
  const { searchParams } = new URL(req.url);
  const date = (searchParams.get("date") ?? "").trim();

  const internalUrl = `/api/buyer/today-stats${date ? `?date=${encodeURIComponent(date)}` : ""}`;

  // 1) access token cookie borligini tekshiramiz (auth true bo‘lsa serverFetch ham qo‘shadi)
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
      tag: "buyer.todayStats",
    });

    return NextResponse.json(
      { message: "Not authenticated", missingCookie: AUTH_COOKIE_NAME },
      { status: 401 },
    );
  }

  // backend call (serverFetch outgoing log qiladi)
  const callBackend = async () => {
    return await serverFetch<any>(
      `/api/v1/admin/orders/today-stats/?date=${encodeURIComponent(date)}`,
      {
        method: "GET",
        auth: true,
        tag: "buyer.todayStats",
      },
    );
  };

  try {
    const data = await callBackend();

    appendLog({
      direction: "incoming",
      method: "GET",
      url: internalUrl,
      status: 200,
      duration_ms: Date.now() - start,
      reqHeaders: maskHeadersForLog(req.headers),
      resBody: data,
      tag: "buyer.todayStats",
    });

    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    // serverFetch error message: "API 401: ..."
    const msg = String(e?.message ?? "");
    const is401 = msg.includes("API 401");

    if (is401) {
      const newToken = await refreshAccessTokenSSR();

      if (newToken) {
        try {
          const data = await callBackend();

          appendLog({
            direction: "incoming",
            method: "GET",
            url: internalUrl,
            status: 200,
            duration_ms: Date.now() - start,
            reqHeaders: maskHeadersForLog(req.headers),
            resBody: data,
            tag: "buyer.todayStats",
          });

          return NextResponse.json(data, { status: 200 });
        } catch (e2: any) {
          appendLog({
            direction: "incoming",
            method: "GET",
            url: internalUrl,
            status: 502,
            duration_ms: Date.now() - start,
            reqHeaders: maskHeadersForLog(req.headers),
            error: e2?.message ?? "backend_failed_after_refresh",
            tag: "buyer.todayStats",
          });

          return NextResponse.json(
            { error: "Backend bilan ulanishda xatolik", detail: e2?.message ?? null },
            { status: 502 },
          );
        }
      } else {
        await clearAuthCookiesSSR();

        appendLog({
          direction: "incoming",
          method: "GET",
          url: internalUrl,
          status: 401,
          duration_ms: Date.now() - start,
          reqHeaders: maskHeadersForLog(req.headers),
          error: "Refresh token missing/invalid",
          tag: "buyer.todayStats",
        });

        return NextResponse.json({ message: "Session expired" }, { status: 401 });
      }
    }

    appendLog({
      direction: "incoming",
      method: "GET",
      url: internalUrl,
      status: 500,
      duration_ms: Date.now() - start,
      reqHeaders: maskHeadersForLog(req.headers),
      error: msg || "unknown_error",
      tag: "buyer.todayStats",
    });

    return NextResponse.json(
      { error: "Xatolik", detail: msg || null },
      { status: 500 },
    );
  }
}
