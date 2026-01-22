// src/app/api/logs/route.ts
import { NextResponse } from "next/server";
import { filterLogs, readLogs, LogDirection } from "@/lib/request-logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function num(v: string | null, def: number) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : def;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const q = searchParams.get("q") ?? undefined;
  const method = searchParams.get("method") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const direction = (searchParams.get("direction") as LogDirection | null) ?? undefined;

  const page = num(searchParams.get("page"), 1);
  const pageSize = Math.min(200, num(searchParams.get("pageSize"), 50));

  // eng yangisi tepada ko‘rinsin:
  const all = readLogs().reverse();

  const filtered = filterLogs(all, { q, method, status, direction });

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize).map((x) => ({
    id: x.id,
    ts: x.ts,
    direction: x.direction,
    method: x.method,
    url: x.url,
    status: x.status,
    duration_ms: x.duration_ms,
    error: x.error,
  }));

  return NextResponse.json({ ok: true, total, items }, { status: 200 });
}
