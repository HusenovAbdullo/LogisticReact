// src/app/api/logs/export/route.ts
import { NextResponse } from "next/server";
import { exportLogsToFile, filterLogs, readLogs } from "@/lib/request-logger";
import path from "node:path";

export const runtime = "nodejs";


export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const q = searchParams.get("q") ?? undefined;
  const method = searchParams.get("method") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;
  const direction = (searchParams.get("direction") as any) ?? undefined;

  const all = readLogs().reverse();
  const filtered = filterLogs(all, { q, method, status, from, to, direction });

  // server diskga JSON fayl yaratamiz
  const filePath = exportLogsToFile(filtered);

  // download qilish uchun: keyingi endpoint orqali serve qilamiz (pastda)
  const fileName = path.basename(filePath);

  return NextResponse.json({
    ok: true,
    count: filtered.length,
    fileName,
    downloadUrl: `/api/logs/file?name=${encodeURIComponent(fileName)}`,
  });
}
