// src/shared/config/env.server.ts
import "server-only";

function cleanBaseUrl(u: string) {
  return u.replace(/\/$/, "");
}

export function getBackendUrl(): string {
  const raw = process.env.BACKEND_URL ?? process.env.API_BASE_URL;
  if (!raw) {
    throw new Error("Missing BACKEND_URL (or API_BASE_URL).");
  }
  return cleanBaseUrl(raw);
}

export function getAuthCookieName(): string {
  return process.env.AUTH_COOKIE ?? "sp_token";
}

/**
 * Refresh endpoint path (backend ichidagi path).
 * Default: /api/v1/admin/auth/refresh/
 */
export function getRefreshPath(): string {
  return process.env.AUTH_REFRESH_PATH ?? "/api/v1/admin/auth/refresh/";
}
