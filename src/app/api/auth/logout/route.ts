import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const c = await cookies();

  c.set("sp_token", "", { path: "/", maxAge: 0 });
  c.set("refresh_token", "", { path: "/", maxAge: 0 });
  c.set("role", "", { path: "/", maxAge: 0 });
  c.set("shop_owner", "", { path: "/", maxAge: 0 });

  return NextResponse.json({ ok: true });
}
