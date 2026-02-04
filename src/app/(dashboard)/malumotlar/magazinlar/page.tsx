"use client";

import React, { useCallback, useMemo } from "react";
import CrudPageClient from "../_components/CrudPageClient";
import { useCrudStore } from "../_lib/useCrud";
import { base, nowIso } from "../_lib/seed";
import type { Shop } from "../_lib/types";

import { getShopAdvancedFilter, shopSearchKeys, type ShopRow } from "./filters";

function toNum(v: any): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function seed(): ShopRow[] {
  const mk = (
    name: string,
    owner: string,
    phone: string,
    address: string,
    avatarUrl: string,
    lat: number,
    lng: number,
    status: Shop["status"] = "active"
  ): ShopRow => {
    const t = nowIso();
    return {
      ...base("shop"),
      name,
      owner,
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
      "Magazin 1",
      "Aliyev Anvar",
      "+998 90 666 66 66",
      "Toshkent shahar, Sergeli tumani",
      "https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&w=200&q=60",
      41.2172,
      69.2236,
      "active"
    ),
    mk(
      "Magazin 2",
      "Tursunov Jamshid",
      "+998 93 777 77 77",
      "Buxoro viloyati, G‘ijduvon tumani",
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=200&q=60",
      40.099,
      64.683,
      "inactive"
    ),
  ];
}

export default function Page() {
  const seedFn = useCallback(seed, []);
  const { ready, items, api } = useCrudStore<ShopRow>("malumotlar_magazinlar", seedFn);

  const columns = useMemo(
    () => [
      {
        key: "avatarUrl",
        header: "",
        render: (r: ShopRow) => (
          <img
            src={r.avatarUrl || "https://via.placeholder.com/80"}
            alt={r.name || "logo"}
            className="h-10 w-10 rounded-2xl object-cover ring-1 ring-slate-200"
          />
        ),
      },
      {
        key: "name",
        header: "Nomi",
        render: (r: ShopRow) => (
          <div className="min-w-0">
            <div className="truncate font-medium text-slate-900">{r.name}</div>
            <div className="truncate text-xs text-slate-500">Egasi: {r.owner ?? "-"}</div>
          </div>
        ),
      },
      { key: "phone", header: "Telefon", render: (r: ShopRow) => r.phone ?? "-" },
      { key: "address", header: "Manzil", render: (r: ShopRow) => r.address ?? "-", hideOnMobile: true },
      {
        key: "status",
        header: "Holat",
        render: (r: ShopRow) => (
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
        { key: "avatarUrl", label: "Rasm / Logo", type: "image", colSpan: 2 },
        { key: "name", label: "Nomi", required: true },
        { key: "owner", label: "Egasi" },
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

    const advancedFilter = useMemo(() => getShopAdvancedFilter(items), [items]);

if (!ready) return <div className="p-4 text-slate-600">Yuklanmoqda...</div>;

  return (
    <CrudPageClient<ShopRow>
      title="Magazinlar"
      description="Magazinlar ro‘yxati"
      rows={items}
      columns={columns as any}
      advancedFilter={advancedFilter}
      searchKeys={shopSearchKeys}
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
        "Egasi": (r as any).owner ?? "-",
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
