// src/lib/request-logger.ts
import "server-only";

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export type LogDirection = "outgoing" | "incoming";

export type RequestLogItem = {
  id: string;
  ts: string; // ISO

  direction: LogDirection;
  method: string;
  url: string;

  status?: number;
  duration_ms?: number;

  reqHeaders?: Record<string, string>;
  resHeaders?: Record<string, string>;

  reqBody?: unknown;
  resBody?: unknown;

  error?: string;
  tag?: string; // ixtiyoriy meta (UI’da qidirishga qulay)
};

export type RequestLogInput = Omit<RequestLogItem, "id" | "ts"> & {
  id?: string;
  ts?: string;
};

export const DATA_DIR = path.join(process.cwd(), "data");
export const LOG_FILE = path.join(DATA_DIR, "request-logs.jsonl");

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function createLogId() {
  return crypto.randomUUID();
}

function safeJson(value: unknown) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return String(value);
  }
}

function truncate(value: unknown, maxLen = 20_000) {
  try {
    const s = JSON.stringify(value);
    if (s.length <= maxLen) return value;
    return { __truncated: true, preview: s.slice(0, maxLen) };
  } catch {
    return String(value);
  }
}

/**
 * JSONL (1 line = 1 log item) append.
 * Bitta fayl: data/request-logs.jsonl
 */
export function appendLog(input: RequestLogInput) {
  ensureDir();

  const item: RequestLogItem = {
    id: input.id ?? createLogId(),
    ts: input.ts ?? new Date().toISOString(),

    direction: input.direction,
    method: input.method,
    url: input.url,

    status: input.status,
    duration_ms: input.duration_ms,

    reqHeaders: input.reqHeaders,
    resHeaders: input.resHeaders,

    reqBody: truncate(safeJson(input.reqBody)),
    resBody: truncate(safeJson(input.resBody)),

    error: input.error,
    tag: input.tag,
  };

  fs.appendFileSync(LOG_FILE, JSON.stringify(item) + "\n", "utf8");
}

export function readLogs(): RequestLogItem[] {
  ensureDir();
  if (!fs.existsSync(LOG_FILE)) return [];

  const raw = fs.readFileSync(LOG_FILE, "utf8");
  const lines = raw.split("\n").filter(Boolean);

  const items: RequestLogItem[] = [];
  for (const line of lines) {
    try {
      items.push(JSON.parse(line));
    } catch {
      // broken line skip
    }
  }
  return items;
}

export function filterLogs(
  all: RequestLogItem[],
  f: {
    q?: string;
    method?: string;
    status?: string; // "200" yoki "200-299"
    from?: string;   // ISO
    to?: string;     // ISO
    direction?: LogDirection;
  },
) {
  const q = (f.q ?? "").toLowerCase().trim();

  const statusRange = (() => {
    if (!f.status) return null;
    if (f.status.includes("-")) {
      const [a, b] = f.status.split("-").map((x) => Number(x.trim()));
      return Number.isFinite(a) && Number.isFinite(b) ? { a, b } : null;
    }
    const s = Number(f.status);
    return Number.isFinite(s) ? { a: s, b: s } : null;
  })();

  const from = f.from ? Date.parse(f.from) : null;
  const to = f.to ? Date.parse(f.to) : null;

  return all.filter((x) => {
    if (f.direction && x.direction !== f.direction) return false;
    if (f.method && x.method.toUpperCase() !== f.method.toUpperCase()) return false;

    if (statusRange) {
      const st = x.status ?? -1;
      if (!(st >= statusRange.a && st <= statusRange.b)) return false;
    }

    const t = Date.parse(x.ts);
    if (from && Number.isFinite(from) && t < from) return false;
    if (to && Number.isFinite(to) && t > to) return false;

    if (q) {
      const hay = `${x.method} ${x.url} ${x.status ?? ""} ${x.error ?? ""} ${x.tag ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }

    return true;
  });
}

/**
 * Filter qilingan loglarni JSON faylga eksport
 */
export function exportLogsToFile(items: RequestLogItem[]) {
  ensureDir();
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const out = path.join(DATA_DIR, `request-logs-export-${stamp}.json`);
  fs.writeFileSync(out, JSON.stringify(items, null, 2), "utf8");
  return out;
}

// Turbopack uchun “aniq” export ro‘yxati
export { DATA_DIR as __LOG_DATA_DIR, LOG_FILE as __LOG_FILE };
