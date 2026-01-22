// src/shared/api/http.ts
import { cookies, headers } from "next/headers";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD";

export type FetchOptions = Omit<RequestInit, "method" | "body" | "headers"> & {
  method?: HttpMethod;
  headers?: HeadersInit;
  auth?: boolean;
  body?: unknown;
};

const API_BASE = process.env.API_BASE_URL || process.env.BACKEND_URL || "";

/* =========================
 * Helpers
 * ========================= */
function isFormDataBody(body: unknown): body is FormData {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

function isPlainObject(body: unknown): body is Record<string, unknown> {
  if (body == null) return false;
  if (typeof body !== "object") return false;
  if (Array.isArray(body)) return false;
  if (isFormDataBody(body)) return false;
  return true;
}

function normalize(options: FetchOptions) {
  const method: HttpMethod = options.method ?? "GET";
  const h = new Headers(options.headers);
  const body = options.body;

  if (method === "GET" || method === "HEAD" || body == null) {
    return { method, headers: h, body: undefined as BodyInit | undefined };
  }

  if (isFormDataBody(body)) {
    return { method, headers: h, body };
  }

  if (isPlainObject(body)) {
    if (!h.has("Content-Type")) h.set("Content-Type", "application/json");
    return { method, headers: h, body: JSON.stringify(body) };
  }

  return { method, headers: h, body: body as BodyInit };
}

async function applyAuth(headersObj: Headers, auth?: boolean) {
  if (!auth) return;

  // .env.local => AUTH_COOKIE=sp_token bo'lishi shart
  const cookieName = process.env.AUTH_COOKIE ?? "sp_token";
  const c = await cookies();
  const token = c.get(cookieName)?.value;

  if (token && !headersObj.has("Authorization")) {
    headersObj.set("Authorization", `Bearer ${token}`);
  }
}

function toAbsoluteUrl(base: string, path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (!base) return path;
  if (path.startsWith("/")) return `${base}${path}`;
  return `${base}/${path}`;
}

async function getOrigin() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return "http://localhost:3000";
  return `${proto}://${host}`;
}

async function buildError(res: Response) {
  const ct = res.headers.get("content-type") ?? "";

  if (ct.includes("application/json")) {
    try {
      const j: any = await res.json();
      const msg =
        j?.message ?? j?.detail ?? j?.error ?? j?.title ?? JSON.stringify(j);
      return new Error(`API ${res.status}: ${msg}`);
    } catch {}
  }

  const t = await res.text().catch(() => "");
  return new Error(`API ${res.status}: ${t || res.statusText}`);
}

async function parse<T>(res: Response): Promise<T> {
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) {
    return (await res.text()) as unknown as T;
  }
  return (await res.json()) as T;
}

/* =========================
 * serverFetch => backend
 * ========================= */
export async function serverFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { method, headers, body } = normalize(options);
  await applyAuth(headers, options.auth);

  const url = toAbsoluteUrl(API_BASE, path);

  const res = await fetch(url, {
    ...options,
    method,
    headers,
    body,
    cache: "no-store",
  });

  if (!res.ok) throw await buildError(res);
  return await parse<T>(res);
}

/* =========================
 * serverFetchInternal => next /api
 * ========================= */
export async function serverFetchInternal<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { method, headers, body } = normalize(options);
  await applyAuth(headers, options.auth);

  const origin = await getOrigin();
  const url = toAbsoluteUrl(origin, path);

  const res = await fetch(url, {
    ...options,
    method,
    headers,
    body,
    cache: "no-store",
  });

  if (!res.ok) throw await buildError(res);
  return await parse<T>(res);
}
