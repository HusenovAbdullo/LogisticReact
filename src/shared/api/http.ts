// src/shared/api/http.ts
import "server-only";

import { cookies, headers } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/lib/auth";

// ixtiyoriy: agar siz request-logger.ts qo‘shgan bo‘lsangiz
import { appendLog } from "@/lib/request-logger";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD";

export type FetchOptions = Omit<RequestInit, "method" | "body" | "headers"> & {
  method?: HttpMethod;
  headers?: HeadersInit;
  auth?: boolean;
  body?: unknown;

  /**
   * Log qilishni majburan yoqish/o‘chirish (default: env bo‘yicha).
   * Masalan token refresh yoki katta fayl upload’da log istemasangiz.
   */
  log?: boolean;

  /**
   * Log meta: endpoint nomi yoki modul nomi (ixtiyoriy)
   */
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

const API_BASE = cleanBaseUrl(RAW_API_BASE);

// default log: development’da true, production’da env bilan boshqariladi
const DEFAULT_LOG_ENABLED =
  process.env.LOG_REQUESTS
    ? process.env.LOG_REQUESTS === "1" || process.env.LOG_REQUESTS === "true"
    : process.env.NODE_ENV !== "production";

/* =========================
 * Helpers
 * ========================= */
function cleanBaseUrl(u: string) {
  return (u || "").replace(/\/+$/, "");
}

function isFormDataBody(body: unknown): body is FormData {
  // Node runtime’da FormData mavjud bo‘ladi (undici). Edge’da ham.
  return typeof FormData !== "undefined" && body instanceof FormData;
}

function isPlainObject(body: unknown): body is Record<string, unknown> {
  if (body == null) return false;
  if (typeof body !== "object") return false;
  if (Array.isArray(body)) return false;
  if (isFormDataBody(body)) return false;
  return true;
}

function toAbsoluteUrl(base: string, path: string) {
  if (!path) return base;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (!base) return path;
  if (path.startsWith("/")) return `${base}${path}`;
  return `${base}/${path}`;
}

function shouldHaveBody(method: HttpMethod) {
  return !(method === "GET" || method === "HEAD");
}

function normalize(options: FetchOptions) {
  const method: HttpMethod = options.method ?? "GET";
  const h = new Headers(options.headers);
  const body = options.body;

  if (!shouldHaveBody(method) || body == null) {
    return { method, headers: h, body: undefined as BodyInit | undefined };
  }

  if (isFormDataBody(body)) {
    // Content-Type ni qo‘lda qo‘ymang (boundary kerak)
    return { method, headers: h, body };
  }

  if (isPlainObject(body)) {
    if (!h.has("Content-Type")) h.set("Content-Type", "application/json");
    return { method, headers: h, body: JSON.stringify(body) };
  }

  // string / Blob / ArrayBuffer / URLSearchParams va hok.
  return { method, headers: h, body: body as BodyInit };
}

function maskHeadersForLog(h: Headers) {
  const out: Record<string, string> = {};
  for (const [k, v] of h.entries()) {
    const key = k.toLowerCase();
    if (key === "authorization") {
      out[k] = "Bearer ***";
      continue;
    }
    if (key === "cookie") {
      out[k] = "***";
      continue;
    }
    out[k] = v;
  }
  return out;
}

async function applyAuth(headersObj: Headers, auth?: boolean) {
  if (!auth) return;

  const c = await cookies();
  const token = c.get(AUTH_COOKIE_NAME)?.value;

  if (token && !headersObj.has("Authorization")) {
    headersObj.set("Authorization", `Bearer ${token}`);
  }
}

/**
 * Next server’da internal /api chaqirish uchun origin yasash.
 */
async function getOrigin() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return "http://localhost:3000";
  return `${proto}://${host}`;
}

/**
 * Response body’ni log/err uchun xavfsiz o‘qish (consume bo‘lmasligi uchun clone).
 */
async function readBodySafe(res: Response): Promise<unknown> {
  const ct = res.headers.get("content-type") ?? "";
  try {
    if (ct.includes("application/json")) {
      return await res.clone().json();
    }
    const t = await res.clone().text();
    return t;
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

function pickLogEnabled(opt?: boolean) {
  if (typeof opt === "boolean") return opt;
  return DEFAULT_LOG_ENABLED;
}

function bodyForLog(originalBody: unknown) {
  // FormData log qilinmaydi (katta va binary bo‘lishi mumkin)
  if (isFormDataBody(originalBody)) return { __formData: true };
  // RequestInit.body string bo‘lsa ham bo‘lishi mumkin
  return originalBody ?? null;
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
    appendLog({
      ts: new Date().toISOString(),
      direction: "outgoing",
      method: p.method,
      url: p.url,
      status: p.status,
      duration_ms: p.duration_ms,
      reqHeaders: maskHeadersForLog(p.reqHeaders),
      reqBody: bodyForLog(p.reqBody),
      resHeaders: p.resHeaders ? Object.fromEntries(p.resHeaders.entries()) : undefined,
      resBody: p.resBody,
      error: p.error,
      // tag ni resBody ichiga aralashtirmaymiz, xohlasangiz logger modeliga qo‘shasiz
      // hozircha url/method orqali qidirish yetarli
    });
  } catch {
    // log xatosi request’ni sindirmasin
  }
}

/* =========================
 * Core fetch (shared)
 * ========================= */
async function doFetch<T>(p: {
  url: string;
  options: FetchOptions;
}): Promise<T> {
  const start = Date.now();

  const { method, headers: h, body } = normalize(p.options);
  await applyAuth(h, p.options.auth);

  const logEnabled = pickLogEnabled(p.options.log);

  try {
    const res = await fetch(p.url, {
      ...p.options,
      method,
      headers: h,
      body,
      cache: "no-store",
    });

    const duration_ms = Date.now() - start;

    // log uchun body
    const resBodyForLog = logEnabled ? await readBodySafe(res) : undefined;

    if (!res.ok) {
      if (logEnabled) {
        await logOutgoing({
          url: p.url,
          method,
          tag: p.options.tag,
          reqHeaders: h,
          reqBody: p.options.body,
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
        url: p.url,
        method,
        tag: p.options.tag,
        reqHeaders: h,
        reqBody: p.options.body,
        status: res.status,
        duration_ms,
        resHeaders: res.headers,
        // log’da parse qilingan natijani yozish ham mumkin; lekin katta bo‘lishi mumkin.
        // resBodyForLog odatda yetarli.
        resBody: resBodyForLog,
      });
    }

    return data;
  } catch (e: any) {
    const duration_ms = Date.now() - start;

    if (logEnabled) {
      await logOutgoing({
        url: p.url,
        method: (p.options.method ?? "GET") as HttpMethod,
        tag: p.options.tag,
        reqHeaders: new Headers(p.options.headers),
        reqBody: p.options.body,
        duration_ms,
        error: e?.message ?? "fetch_error",
      });
    }

    throw e;
  }
}

/* =========================
 * serverFetch => backend
 * ========================= */
export async function serverFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const url = toAbsoluteUrl(API_BASE, path);
  return await doFetch<T>({ url, options });
}

/* =========================
 * serverFetchInternal => next /api
 * ========================= */
export async function serverFetchInternal<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const origin = await getOrigin();
  const url = toAbsoluteUrl(origin, path);
  return await doFetch<T>({ url, options });
}
