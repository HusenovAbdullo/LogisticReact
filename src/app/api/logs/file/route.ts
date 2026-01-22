// src/app/api/logs/file/route.ts
import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

export const runtime = "nodejs";


export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");

  if (!name) return NextResponse.json({ ok: false, error: "name_required" }, { status: 400 });

  // faqat data ichidan o‘qish (path traversal himoyasi)
  const safeName = path.basename(name);
  const filePath = path.join(process.cwd(), "data", safeName);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ ok: false, error: "file_not_found" }, { status: 404 });
  }

  const buf = fs.readFileSync(filePath);
  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeName}"`,
    },
  });
}
