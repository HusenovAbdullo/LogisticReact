"use client";

import React, { useCallback, useMemo } from "react";
import CrudPageClient from "../_components/CrudPageClient";
import { useCrudStore } from "../_lib/useCrud";
import { base, nowIso } from "../_lib/seed";
import type { Office } from "../_lib/types";

import { getOfficeAdvancedFilter, officeSearchKeys, type OfficeRow } from "./filters";

function toNum(v: any): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function seed(): OfficeRow[] {
  const mk = (
    name: string,
    manager: string,
    phone: string,
    address: string,
    avatarUrl: string,
    lat: number,
    lng: number,
    status: Office["status"] = "active"
  ): OfficeRow => {
    const t = nowIso();
    return {
      ...base("office"),
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
      "Ofis Yunusobod",
      "Husenov Abdullo",
      "+998 90 000 00 00",
      "Toshkent shahar, Yunusobod tumani",
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=200&q=60",
      41.3441,
      69.2846,
      "active"
    ),
    mk(
      "Ofis Buxoro",
      "Islomov Aziz",
      "+998 91 111 11 11",
      "Buxoro viloyati, G‘ijduvon tumani",
      "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=200&q=60",
      40.099,
      64.683,
      "inactive"
    ),
  ];
}

export default function Page() {
  const seedFn = useCallback(seed, []);
  const { ready, items, api } = useCrudStore<OfficeRow>("malumotlar_ofislar", seedFn);

  const columns = useMemo(
    () => [
      {
        key: "avatarUrl",
        header: "",
        render: (r: OfficeRow) => (
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
        render: (r: OfficeRow) => (
          <div className="min-w-0">
            <div className="truncate font-medium text-slate-900">{r.name}</div>
            <div className="truncate text-xs text-slate-500">Mudir: {(r as any).manager ?? "-"}</div>
          </div>
        ),
      },
      { key: "phone", header: "Telefon", render: (r: OfficeRow) => r.phone ?? "-" },
      { key: "address", header: "Manzil", render: (r: OfficeRow) => r.address ?? "-", hideOnMobile: true },
      {
        key: "status",
        header: "Holat",
        render: (r: OfficeRow) => (
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

    const advancedFilter = useMemo(() => getOfficeAdvancedFilter(items), [items]);

if (!ready) return <div className="p-4 text-slate-600">Yuklanmoqda...</div>;

  return (
    <CrudPageClient<OfficeRow>
      title="Ofislar"
      description="Ofislar ro‘yxati"
      rows={items}
      columns={columns as any}
      advancedFilter={advancedFilter}
      searchKeys={officeSearchKeys}
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
