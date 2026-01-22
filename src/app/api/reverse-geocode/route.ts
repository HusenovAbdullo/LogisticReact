import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json(
      { error: "lat/lon required" },
      { status: 400 }
    );
  }

  const url =
    `https://nominatim.openstreetmap.org/reverse` +
    `?lat=${lat}` +
    `&lon=${lon}` +
    `&format=json` +
    `&accept-language=uz`;

  try {
    const res = await fetch(url, {
      headers: {
        // ❗ Nominatim TALAB QILADI
        "User-Agent": "NextLine-Dashboard/1.0",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Nominatim error:", res.status, text);
      throw new Error("Reverse geocode failed");
    }

    const data = await res.json();

    return NextResponse.json({
      city:
        data.address?.city ||
        data.address?.town ||
        data.address?.village ||
        null,
      admin1: data.address?.state || null,
      country: data.address?.country || null,
    });
  } catch (e) {
    console.error("Reverse geocode error:", e);
    return NextResponse.json(
      { error: "Reverse geocode error" },
      { status: 500 }
    );
  }
}
