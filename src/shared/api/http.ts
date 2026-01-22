// src/shared/api/http.ts
import "server-only";

import { cookies, headers } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/lib/auth";
import { appendLog as appendRequestLog } from "@/lib/request-logger";

/* =========================
 * Types
 * ========================= */
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD";

export type FetchOptions = Omit<RequestInit, "method" | "body" | "headers"> & {
  method?: HttpMethod;
  headers?: HeadersInit;
  auth?: boolean; // token/cookie kerak bo'lsa true
  body?: unknown;

  // logging
  log?: boolean;
  tag?: string;
};

/* =========================
 * Env
 * ========================= */
const RAW_API_BASE =
  process.env.API_BASE_URL ||
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "";

function cleanBaseUrl(u: string) {
  return (u || "").replace(/\/+$/, "");
}

const API_BASE = cleanBaseUrl(RAW_API_BASE);

const DEFAULT_LOG_ENABLED =
  process.env.LOG_REQUESTS
    ? process.env.LOG_REQUESTS === "1" || process.env.LOG_REQUESTS === "true"
    : process.env.NODE_ENV !== "production";

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

function shouldHaveBody(method: HttpMethod) {
  return !(method === "GET" || method === "HEAD");
}

function normalize(options: FetchOptions) {
  const method: HttpMethod = options.method ?? "GET";
  const h = new Headers(options.headers);
  const originalBody = options.body;

  if (!shouldHaveBody(method) || originalBody == null) {
    return { method, headers: h, body: undefined as BodyInit | undefined };
  }

  if (isFormDataBody(originalBody)) {
    return { method, headers: h, body: originalBody };
  }

  if (isPlainObject(originalBody)) {
    if (!h.has("Content-Type")) h.set("Content-Type", "application/json");
    return { method, headers: h, body: JSON.stringify(originalBody) };
  }

  return { method, headers: h, body: originalBody as BodyInit };
}

function toAbsoluteUrl(base: string, p: string) {
  if (!p) return base;
  if (p.startsWith("http://") || p.startsWith("https://")) return p;
  if (!base) return p;
  if (p.startsWith("/")) return `${base}${p}`;
  return `${base}/${p}`;
}

function pickLogEnabled(opt?: boolean) {
  if (typeof opt === "boolean") return opt;
  return DEFAULT_LOG_ENABLED;
}

function maskHeadersForLog(h: Headers) {
  const out: Record<string, string> = {};
  for (const [k, v] of h.entries()) {
    const key = k.toLowerCase();
    if (key === "authorization") out[k] = "Bearer ***";
    else if (key === "cookie") out[k] = "***";
    else out[k] = v;
  }
  return out;
}

function bodyForLog(originalBody: unknown) {
  if (isFormDataBody(originalBody)) return { __formData: true };
  return originalBody ?? null;
}

/**
 * Backend fetch (external) uchun:
 * - Cookie'dan AUTH_COOKIE_NAME tokenni olib Authorization: Bearer qo'yadi.
 */
async function applyAuthHeader(headersObj: Headers, auth?: boolean) {
  if (!auth) return;
  const c = await cookies(); // Next 15/16: Promise
  const token = c.get(AUTH_COOKIE_NAME)?.value;
  if (token && !headersObj.has("Authorization")) {
    headersObj.set("Authorization", `Bearer ${token}`);
  }
}

/**
 * Internal fetch (Next API routes) uchun origin yasash.
 */
async function getOrigin() {
  const h = await headers(); // Next 15/16: Promise
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return "http://localhost:3000";
  return `${proto}://${host}`;
}

async function readBodySafe(res: Response): Promise<unknown> {
  const ct = res.headers.get("content-type") ?? "";
  try {
    if (ct.includes("application/json")) return await res.clone().json();
    return await res.clone().text();
  } catch {
    return null;
  }
}

async function buildError(res: Response) {
  const body = await readBodySafe(res);
  if (body && typeof body === "object") {
    const j: any = body;
    const msg =
      j?.message ?? j?.detail ?? j?.error ?? j?.title ?? JSON.stringify(j);
    return new Error(`API ${res.status}: ${msg}`);
  }
  const text = typeof body === "string" ? body : "";
  return new Error(`API ${res.status}: ${text || res.statusText}`);
}

async function parse<T>(res: Response): Promise<T> {
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) {
    return (await res.text()) as unknown as T;
  }
  return (await res.json()) as T;
}

async function logOutgoing(p: {
  url: string;
  method: HttpMethod;
  tag?: string;
  reqHeaders: Headers;
  reqBody: unknown;
  status?: number;
  duration_ms: number;
  resHeaders?: Headers;
  resBody?: unknown;
  error?: string;
}) {
  try {
    appendRequestLog({
      direction: "outgoing",
      method: p.method,
      url: p.url,
      status: p.status,
      duration_ms: p.duration_ms,
      reqHeaders: maskHeadersForLog(p.reqHeaders),
      reqBody: bodyForLog(p.reqBody),
      resHeaders: p.resHeaders
        ? Object.fromEntries(p.resHeaders.entries())
        : undefined,
      resBody: p.resBody,
      error: p.error,
      tag: p.tag,
    });
  } catch {
    // logger xatosi requestni sindirmasin
  }
}

/* =========================
 * Core fetch
 * ========================= */
async function doFetch<T>(url: string, options: FetchOptions): Promise<T> {
  const start = Date.now();
  const { method, headers: h, body } = normalize(options);

  const logEnabled = pickLogEnabled(options.log);

  try {
    const res = await fetch(url, {
      ...options,
      method,
      headers: h,
      body,
      cache: "no-store",
    });

    const duration_ms = Date.now() - start;
    const resBodyForLog = logEnabled ? await readBodySafe(res) : undefined;

    if (!res.ok) {
      if (logEnabled) {
        await logOutgoing({
          url,
          method,
          tag: options.tag,
          reqHeaders: h,
          reqBody: options.body,
          status: res.status,
          duration_ms,
          resHeaders: res.headers,
          resBody: resBodyForLog,
        });
      }
      throw await buildError(res);
    }

    const data = await parse<T>(res);

    if (logEnabled) {
      await logOutgoing({
        url,
        method,
        tag: options.tag,
        reqHeaders: h,
        reqBody: options.body,
        status: res.status,
        duration_ms,
        resHeaders: res.headers,
        resBody: resBodyForLog,
      });
    }

    return data;
  } catch (e: any) {
    const duration_ms = Date.now() - start;

    if (logEnabled) {
      await logOutgoing({
        url,
        method: (options.method ?? "GET") as HttpMethod,
        tag: options.tag,
        reqHeaders: new Headers(options.headers),
        reqBody: options.body,
        duration_ms,
        error: e?.message ?? "fetch_error",
      });
    }

    throw e;
  }
}

/* =========================
 * Public: Backend fetch
 * ========================= */
export async function serverFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const url = toAbsoluteUrl(API_BASE, path);

  // backendga ketadigan requestga Authorization qo'yamiz
  const { headers: h } = normalize(options);
  await applyAuthHeader(h, options.auth);

  return await doFetch<T>(url, {
    ...options,
    headers: h,
  });
}

/* =========================
 * Public: Internal fetch (Next API routes)
 * ========================= */
export async function serverFetchInternal<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const origin = await getOrigin();
  const url = toAbsoluteUrl(origin, path);

  // ✅ Next 15/16: incoming request cookie headerini forward qilamiz
  const reqHeaders = await headers();
  const cookie = reqHeaders.get("cookie") ?? "";

  const h = new Headers(options.headers);

  if (options.auth && cookie && !h.has("cookie")) {
    h.set("cookie", cookie);
  }

  return await doFetch<T>(url, {
    ...options,
    headers: h,
  });
}
