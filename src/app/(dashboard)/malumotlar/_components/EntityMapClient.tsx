"use client";

import React, { useMemo, useState } from "react";
import { MapContainer, Marker, Polyline, TileLayer, Popup } from "react-leaflet";
import L from "leaflet";
import type { TrackPoint } from "./EntityMap";

type Preset = "all" | "24h" | "7d" | "30d";

function msPreset(p: Preset) {
  if (p === "24h") return 24 * 60 * 60 * 1000;
  if (p === "7d") return 7 * 24 * 60 * 60 * 1000;
  if (p === "30d") return 30 * 24 * 60 * 60 * 1000;
  return Infinity;
}

// ✅ Leaflet default icon muammolari (marker ko‘rinmay qolishi) bo‘lmasin:
const markerIcon = L.divIcon({
  className: "",
  html: `<div style="width: 28px; height: 28px; border-radius: 14px; background: #111827; color: white; display: grid; place-items: center; font-size: 14px; box-shadow: 0 10px 20px rgba(0,0,0,.2)">📍</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

type Props = {
  lat: number;
  lng: number;
  track?: TrackPoint[];
  title?: string;
};

function isFiniteNum(v: any) {
  const n = Number(v);
  return Number.isFinite(n);
}

export default function EntityMapClient({ lat, lng, track, title }: Props) {
  const [preset, setPreset] = useState<Preset>("all");

  // ✅ Lat/Lng invalid bo‘lsa map yiqilib ketmasin:
  const safeLat = isFiniteNum(lat) ? Number(lat) : 41.3111; // Tashkent fallback
  const safeLng = isFiniteNum(lng) ? Number(lng) : 69.2797;

  const filtered = useMemo(() => {
    const list = (track ?? []).filter((p) => isFiniteNum(p.lat) && isFiniteNum(p.lng) && !!p.at);

    if (preset === "all") return list;

    const now = Date.now();
    const limit = msPreset(preset);

    return list.filter((p) => {
      const t = new Date(p.at).getTime();
      if (!Number.isFinite(t)) return false;
      return now - t <= limit;
    });
  }, [track, preset]);

  const poly = useMemo(() => {
    return filtered.map((p) => [Number(p.lat), Number(p.lng)] as [number, number]);
  }, [filtered]);

  const hasMarker = isFiniteNum(lat) && isFiniteNum(lng);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-900">Xarita</div>
          <div className="text-xs text-slate-500">
            {title ? `${title} · ` : ""}
            Lat: <span className="font-semibold text-slate-700">{hasMarker ? lat : safeLat}</span> · Lng:{" "}
            <span className="font-semibold text-slate-700">{hasMarker ? lng : safeLng}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            [
              ["all", "Hammasi"],
              ["24h", "24 soat"],
              ["7d", "7 kun"],
              ["30d", "30 kun"],
            ] as const
          ).map(([k, label]) => {
            const on = preset === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setPreset(k)}
                className={
                  "rounded-full px-3 py-1 text-xs font-semibold transition " +
                  (on ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200")
                }
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <MapContainer
          center={[safeLat, safeLng]}
          zoom={hasMarker ? 15 : 10}
          style={{ height: 380, width: "100%" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {hasMarker ? (
            <Marker position={[Number(lat), Number(lng)]} icon={markerIcon}>
              <Popup>
                <div className="text-sm font-semibold">{title ?? "Lokatsiya"}</div>
                <div className="text-xs text-slate-600">
                  {Number(lat)}, {Number(lng)}
                </div>
              </Popup>
            </Marker>
          ) : null}

          {poly.length >= 2 ? <Polyline positions={poly} /> : null}
        </MapContainer>
      </div>

      <div className="mt-2 text-xs text-slate-500">
        Yo‘l nuqtalari: <span className="font-semibold text-slate-700">{filtered.length}</span>
      </div>
    </div>
  );
}
