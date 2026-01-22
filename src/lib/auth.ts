// src/lib/auth.ts
import { cookies } from "next/headers";

/* =========================
 * Cookie names (env-driven)
 * ========================= */
export const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE ?? "sp_token";
export const REFRESH_COOKIE_NAME = process.env.REFRESH_COOKIE ?? "refresh_token";

/* =========================
 * Env helpers
 * ========================= */
function getBackendUrl(): string | null {
  const u =
    process.env.BACKEND_URL ||
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!u) return null;
  return cleanBaseUrl(u);
}

function cleanBaseUrl(u: string) {
  return u.replace(/\/+$/, "");
}

function isProd() {
  return process.env.NODE_ENV === "production";
}

/* =========================
 * Cookie options
 * =========================
 * Eslatma:
 * - Next.js cookies() SSR writer uchun httpOnly cookie set qilsa bo‘ladi.
 * - Barcha joyda bir xil options ishlatish muhim (clear paytida ham).
 * ========================= */
type SameSite = "lax" | "strict" | "none";

function cookieBase(opts?: { maxAge?: number; sameSite?: SameSite }) {
  return {
    httpOnly: true as const,
    secure: isProd(),
    sameSite: (opts?.sameSite ?? "lax") as SameSite,
    path: "/" as const,
    ...(typeof opts?.maxAge === "number" ? { maxAge: opts.maxAge } : {}),
  };
}

/* =========================
 * Roles (SSR)
 * ========================= */
export type Role = "shop" | "admin";

export async function getRoleSSR(): Promise<{ role: Role; shopOwner: boolean }> {
  const c = await cookies();
  const roleRaw = c.get("role")?.value;
  const shopOwner = c.get("shop_owner")?.value === "true";

  const role: Role =
    roleRaw === "shop" || roleRaw === "admin"
      ? (roleRaw as Role)
      : shopOwner
      ? "shop"
      : "admin";

  return { role, shopOwner };
}

/* =========================
 * Token helpers (SSR)
 * ========================= */
export async function getAccessTokenSSR(): Promise<string | null> {
  const c = await cookies();
  return c.get(AUTH_COOKIE_NAME)?.value ?? null;
}

export async function getRefreshTokenSSR(): Promise<string | null> {
  const c = await cookies();
  return c.get(REFRESH_COOKIE_NAME)?.value ?? null;
}

export async function hasAccessSSR(): Promise<boolean> {
  const t = await getAccessTokenSSR();
  return Boolean(t);
}

export const hasAccessTokenSSR = hasAccessSSR;

/* =========================
 * Cookie writers (SSR)
 * ========================= */
export async function setAuthCookiesSSR(p: {
  accessToken: string;
  refreshToken?: string;
  accessMaxAgeSeconds?: number; // access uchun
  refreshMaxAgeSeconds?: number; // refresh uchun (default 30 kun)
}) {
  const c = await cookies();

  const accessMaxAge = p.accessMaxAgeSeconds ?? 60 * 60; // 1 soat default
  c.set(AUTH_COOKIE_NAME, p.accessToken, cookieBase({ maxAge: accessMaxAge }));

  if (p.refreshToken) {
    const refreshMaxAge = p.refreshMaxAgeSeconds ?? 60 * 60 * 24 * 30; // 30 kun default
    c.set(REFRESH_COOKIE_NAME, p.refreshToken, cookieBase({ maxAge: refreshMaxAge }));
  }
}

/**
 * Cookie’larni ishonchli tozalash:
 * - delete() ba’zi holatlarda (path/domain mismatch) kutilganidek ishlamasligi mumkin.
 * - Shu sabab maxAge=0 bilan set ham qilamiz.
 */
export async function clearAuthCookiesSSR() {
  const c = await cookies();

  // 1) delete (tezkor)
  try {
    c.delete(AUTH_COOKIE_NAME);
    c.delete(REFRESH_COOKIE_NAME);
  } catch {
    // ba’zi runtime’larda delete cheklangan bo‘lishi mumkin
  }

  // 2) "overwrite" qilib, ishonchli tozalash
  c.set(AUTH_COOKIE_NAME, "", cookieBase({ maxAge: 0 }));
  c.set(REFRESH_COOKIE_NAME, "", cookieBase({ maxAge: 0 }));
}

/* =========================
 * Refresh flow (SSR)
 * =========================
 * 1) refresh cookie bor bo‘lsa backend refresh endpoint’ga uriladi
 * 2) yangi access cookie set qilinadi
 * 3) yangi access token qaytariladi
 *
 * Default refresh path: /api/v1/admin/auth/refresh/
 * Boshqacha bo‘lsa: REFRESH_PATH env qo‘ying.
 * ========================= */
type RefreshResponseLike = {
  access?: string;
  access_token?: string;
  token?: string;
  refresh?: string;
  refresh_token?: string;
  expires_in?: number; // seconds
  access_expires_in?: number; // seconds (ba’zi backendlar)
};

function pickAccessToken(d: RefreshResponseLike | null | undefined): string | null {
  return (d?.access || d?.access_token || d?.token || null) ?? null;
}

function pickRefreshToken(d: RefreshResponseLike | null | undefined): string | undefined {
  return d?.refresh || d?.refresh_token || undefined;
}

function pickExpiresIn(d: RefreshResponseLike | null | undefined): number | undefined {
  const v = d?.access_expires_in ?? d?.expires_in;
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

export async function refreshAccessTokenSSR(): Promise<string | null> {
  const refresh = await getRefreshTokenSSR();
  if (!refresh) return null;

  const backend = getBackendUrl();
  if (!backend) return null;

  const refreshPath = process.env.REFRESH_PATH ?? "/api/v1/admin/auth/refresh/";
  const url = `${backend}${refreshPath.startsWith("/") ? "" : "/"}${refreshPath}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({ refresh }),
    cache: "no-store",
  });

  if (!res.ok) return null;

  let data: RefreshResponseLike | null = null;
  try {
    data = (await res.json()) as RefreshResponseLike;
  } catch {
    data = null;
  }

  const accessToken = pickAccessToken(data);
  if (!accessToken) return null;

  const rotatedRefresh = pickRefreshToken(data);
  const expiresIn = pickExpiresIn(data);

  await setAuthCookiesSSR({
    accessToken,
    refreshToken: rotatedRefresh, // rotation bo‘lsa yangilanadi
    accessMaxAgeSeconds: expiresIn, // bo‘lsa ishlatamiz, bo‘lmasa default
    // refreshMaxAgeSeconds default 30 kun
  });

  return accessToken;
}

/* =========================
 * Optional helper:
 * Authorization header (SSR fetch’lar uchun qulay)
 * ========================= */
export async function buildAuthHeadersSSR(extra?: HeadersInit): Promise<HeadersInit> {
  const token = await getAccessTokenSSR();
  return {
    ...(extra ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
