// src/lib/auth.ts
import { cookies } from "next/headers";

export const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE ?? "sp_token";
export const REFRESH_COOKIE_NAME = process.env.REFRESH_COOKIE ?? "refresh_token";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL;

function cleanBaseUrl(u: string) {
  return u.replace(/\/$/, "");
}

export type Role = "shop" | "admin";

/* =========================
 * Role helpers (SSR)
 * ========================= */
export async function getRoleSSR() {
  const c = await cookies();
  const role = c.get("role")?.value as Role | undefined;
  const shopOwner = c.get("shop_owner")?.value === "true";

  return {
    role: role ?? (shopOwner ? "shop" : "admin"),
    shopOwner,
  };
}

/* =========================
 * Token helpers (SSR)
 * ========================= */
export async function getAccessTokenSSR() {
  const c = await cookies();
  return c.get(AUTH_COOKIE_NAME)?.value ?? null;
}

export async function getRefreshTokenSSR() {
  const c = await cookies();
  return c.get(REFRESH_COOKIE_NAME)?.value ?? null;
}

export async function hasAccessSSR() {
  return Boolean(await getAccessTokenSSR());
}

export const hasAccessTokenSSR = hasAccessSSR;

/* =========================
 * Cookie writers (SSR)
 * ========================= */
export async function setAuthCookiesSSR(p: {
  accessToken: string;
  refreshToken?: string;
  maxAgeSeconds?: number;
}) {
  const c = await cookies();
  const isProd = process.env.NODE_ENV === "production";

  const maxAge = p.maxAgeSeconds ?? 60 * 60; // 1 soat (default)

  c.set(AUTH_COOKIE_NAME, p.accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge,
  });

  if (p.refreshToken) {
    c.set(REFRESH_COOKIE_NAME, p.refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      // refresh odatda uzoqroq bo‘ladi
      maxAge: 60 * 60 * 24 * 30, // 30 kun (default)
    });
  }
}

export async function clearAuthCookiesSSR() {
  const c = await cookies();
  c.delete(AUTH_COOKIE_NAME);
  c.delete(REFRESH_COOKIE_NAME);
}

/* =========================
 * Refresh flow (SSR)
 * =========================
 * 1) refresh_token cookie bor bo‘lsa backend refresh endpoint’ga uriladi
 * 2) yangi access cookie set qilinadi
 * 3) yangi access token qaytariladi
 *
 * Eslatma: refresh endpoint URL’i sizning backend’ga mos bo‘lishi kerak.
 * Default: /api/v1/admin/auth/refresh/
 * Agar boshqacha bo‘lsa, REFRESH_PATH env qo‘ying.
 * ========================= */
export async function refreshAccessTokenSSR(): Promise<string | null> {
  const refresh = await getRefreshTokenSSR();
  if (!refresh) return null;

  if (!BACKEND_URL) return null;

  const refreshPath = process.env.REFRESH_PATH ?? "/api/v1/admin/auth/refresh/";
  const url = `${cleanBaseUrl(BACKEND_URL)}${refreshPath}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify({ refresh }),
    cache: "no-store",
  });

  if (!res.ok) return null;

  const data = await res.json().catch(() => null);
  const accessToken: string | undefined =
    data?.access || data?.access_token || data?.token;

  if (!accessToken) return null;

  // refresh rotation bo‘lsa ham qo‘llab-quvvatlaymiz
  const refreshToken: string | undefined =
    data?.refresh || data?.refresh_token || undefined;

  await setAuthCookiesSSR({
    accessToken,
    refreshToken,
    // ba’zi backend’lar expires_in beradi (sekund)
    maxAgeSeconds: typeof data?.expires_in === "number" ? data.expires_in : undefined,
  });

  return accessToken;
}
