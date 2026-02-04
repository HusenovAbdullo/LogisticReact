"use client";

import React, { useCallback, useMemo } from "react";
import CrudPageClient from "../_components/CrudPageClient";
import { useCrudStore } from "../_lib/useCrud";
import { base, nowIso } from "../_lib/seed";
import type { Warehouse } from "../_lib/types";

import { getWarehouseAdvancedFilter, warehouseSearchKeys, type WarehouseRow } from "./filters";

function toNum(v: any): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function seed(): WarehouseRow[] {
  const mk = (
    name: string,
    manager: string,
    phone: string,
    address: string,
    avatarUrl: string,
    lat: number,
    lng: number,
    status: Warehouse["status"] = "active"
  ): WarehouseRow => {
    const t = nowIso();
    return {
      ...base("warehouse"),
      name,
      manager,
      phone,
      address,
      status,
      avatarUrl,
      lat,
      lng,
      latitude: lat,
      longitude: lng,
      trackPoints: [{ lat, lng, at: t }],
    };
  };

  return [
    mk(
      "Sklad A",
      "Saidov Diyor",
      "+998 90 888 88 88",
      "Toshkent shahar, Olmazor tumani",
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=200&q=60",
      41.34,
      69.19,
      "active"
    ),
    mk(
      "Sklad B",
      "Yusupov Bekzod",
      "+998 93 999 99 99",
      "Samarqand viloyati, Samarqand shahar",
      "https://images.unsplash.com/photo-1586528116493-9192f0b5227c?auto=format&fit=crop&w=200&q=60",
      39.6542,
      66.9597,
      "inactive"
    ),
  ];
}

export default function Page() {
  const seedFn = useCallback(seed, []);
  const { ready, items, api } = useCrudStore<WarehouseRow>("malumotlar_skladlar", seedFn);

  const columns = useMemo(
    () => [
      {
        key: "avatarUrl",
        header: "",
        render: (r: WarehouseRow) => (
          <img
            src={r.avatarUrl || "https://via.placeholder.com/80"}
            alt={r.name || "img"}
            className="h-10 w-10 rounded-2xl object-cover ring-1 ring-slate-200"
          />
        ),
      },
      {
        key: "name",
        header: "Nomi",
        render: (r: WarehouseRow) => (
          <div className="min-w-0">
            <div className="truncate font-medium text-slate-900">{r.name}</div>
            <div className="truncate text-xs text-slate-500">Mudir: {(r as any).manager ?? "-"}</div>
          </div>
        ),
      },
      { key: "phone", header: "Telefon", render: (r: WarehouseRow) => r.phone ?? "-" },
      { key: "address", header: "Manzil", render: (r: WarehouseRow) => r.address ?? "-", hideOnMobile: true },
      {
        key: "status",
        header: "Holat",
        render: (r: WarehouseRow) => (
          <span
            className={
              "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold " +
              (r.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700")
            }
          >
            {r.status}
          </span>
        ),
      },
    ],
    []
  );

  const fields = useMemo(
    () =>
      [
        { key: "avatarUrl", label: "Rasm", type: "image", colSpan: 2 },
        { key: "name", label: "Nomi", required: true },
        { key: "manager", label: "Mudir" },
        { key: "phone", label: "Telefon", type: "tel" },
        { key: "address", label: "Manzil", type: "textarea", colSpan: 2 },
        { key: "telegram", label: "Telegram", placeholder: "@username" },
        { key: "note", label: "Izoh", type: "textarea", colSpan: 2 },
        { key: "lat", label: "Latitude", type: "number" },
        { key: "lng", label: "Longitude", type: "number" },
        {
          key: "status",
          label: "Holat",
          type: "select",
          options: [
            { value: "active", label: "active" },
            { value: "inactive", label: "inactive" },
          ],
        },
        { key: "latitude", label: "latitude", hide: true },
        { key: "longitude", label: "longitude", hide: true },
        { key: "trackPoints", label: "trackPoints", hide: true },
        { key: "createdAt", label: "Yaratilgan", hide: true },
        { key: "updatedAt", label: "Yangilangan", hide: true },
        { key: "id", label: "ID", hide: true },
      ] as any,
    []
  );

    const advancedFilter = useMemo(() => getWarehouseAdvancedFilter(items), [items]);

if (!ready) return <div className="p-4 text-slate-600">Yuklanmoqda...</div>;

  return (
    <CrudPageClient<WarehouseRow>
      title="Skladlar"
      description="Skladlar ro‘yxati"
      rows={items}
      columns={columns as any}
      advancedFilter={advancedFilter}
      searchKeys={warehouseSearchKeys}
      fields={fields as any}
      onCreate={(payload) => {
        const t = nowIso();
        const lat = toNum((payload as any).lat);
        const lng = toNum((payload as any).lng);
        api.create({
          ...(payload as any),
          lat,
          lng,
          latitude: lat,
          longitude: lng,
          trackPoints: lat != null && lng != null ? [{ lat, lng, at: t }] : [],
          createdAt: t,
          updatedAt: t,
        });
      }}
      onUpdate={(id, patch) => {
        const next: any = { ...(patch as any) };
        if ("lat" in next) next.lat = toNum(next.lat);
        if ("lng" in next) next.lng = toNum(next.lng);
        if ("lat" in next) next.latitude = next.lat;
        if ("lng" in next) next.longitude = next.lng;

        const prev = api.get(id) as any;
        const prevLat = toNum(prev?.lat ?? prev?.latitude);
        const prevLng = toNum(prev?.lng ?? prev?.longitude);
        const newLat = ("lat" in next ? next.lat : prevLat) as any;
        const newLng = ("lng" in next ? next.lng : prevLng) as any;
        if (newLat != null && newLng != null) {
          const changed = prevLat == null || prevLng == null || prevLat !== newLat || prevLng !== newLng;
          if (changed) {
            const prevTrack = Array.isArray(prev?.trackPoints) ? prev.trackPoints : [];
            next.trackPoints = [...prevTrack, { lat: Number(newLat), lng: Number(newLng), at: nowIso() }];
          }
        }

        api.update(id, { ...next, updatedAt: nowIso() } as any);
      }}
      onRemove={(id) => api.remove(id)}
      detailsMap={(r) => ({
        "Nomi": r.name,
        "Mudir": (r as any).manager ?? "-",
        "Telefon": r.phone,
        "Manzil": r.address,
        "Telegram": (r as any).telegram ?? "-",
        "Izoh": (r as any).note ?? "-",
        "Latitude": (r as any).lat ?? (r as any).latitude ?? "-",
        "Longitude": (r as any).lng ?? (r as any).longitude ?? "-",
        "Holat": r.status,
        "Yaratilgan": r.createdAt,
        "Yangilangan": r.updatedAt,
        "ID": r.id,
      })}
    />
  );
}
