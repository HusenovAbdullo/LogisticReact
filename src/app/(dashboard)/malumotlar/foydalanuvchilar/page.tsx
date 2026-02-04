"use client";

import React, { useCallback, useMemo } from "react";
import CrudPageClient from "../_components/CrudPageClient";
import { useCrudStore } from "../_lib/useCrud";
import { base, nowIso } from "../_lib/seed";
import type { User } from "../_lib/types";

import { getUserAdvancedFilter, userSearchKeys, type UserRow } from "./filters";

function toNum(v: any): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function seed(): UserRow[] {
  const mk = (
    fullName: string,
    type: User["type"],
    phone: string,
    address: string,
    avatarUrl: string,
    lat: number,
    lng: number,
    status: User["status"] = "active"
  ): UserRow => {
    const t = nowIso();
    return {
      ...base("user"),
      fullName,
      type,
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
      "Karimova Dilnoza",
      "sender",
      "+998 90 444 44 44",
      "Toshkent shahar, Yunusobod tumani",
      "https://i.pravatar.cc/100?img=5",
      41.3333,
      69.2833,
      "active"
    ),
    mk(
      "Nazarov Shavkat",
      "receiver",
      "+998 97 555 55 55",
      "Samarqand viloyati, Bulung‘ur tumani",
      "https://i.pravatar.cc/100?img=24",
      39.6542,
      66.9597,
      "active"
    ),
  ];
}

export default function Page() {
  const seedFn = useCallback(seed, []);
  const { ready, items, api } = useCrudStore<UserRow>("malumotlar_foydalanuvchilar", seedFn);

  const columns = useMemo(
    () => [
      {
        key: "avatarUrl",
        header: "",
        render: (r: UserRow) => (
          <img
            src={r.avatarUrl || "https://via.placeholder.com/80"}
            alt={r.fullName || "avatar"}
            className="h-10 w-10 rounded-2xl object-cover ring-1 ring-slate-200"
          />
        ),
      },
      {
        key: "fullName",
        header: "F.I.Sh",
        render: (r: UserRow) => (
          <div className="min-w-0">
            <div className="truncate font-medium text-slate-900">{r.fullName}</div>
            <div className="truncate text-xs text-slate-500">{r.phone ?? "-"}</div>
          </div>
        ),
      },
      {
        key: "type",
        header: "Turi",
        render: (r: UserRow) => (
          <span
            className={
              "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold " +
              (r.type === "sender" ? "bg-indigo-100 text-indigo-700" : "bg-amber-100 text-amber-700")
            }
          >
            {r.type}
          </span>
        ),
      },
      { key: "address", header: "Manzil", render: (r: UserRow) => r.address ?? "-", hideOnMobile: true },
      {
        key: "status",
        header: "Holat",
        render: (r: UserRow) => (
          <span
            className={
              "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold " +
              (r.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")
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
        { key: "fullName", label: "F.I.Sh", required: true },
        { key: "phone", label: "Telefon", type: "tel" },
        {
          key: "type",
          label: "Turi",
          type: "select",
          options: [
            { value: "sender", label: "sender" },
            { value: "receiver", label: "receiver" },
          ],
        },
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
            { value: "blocked", label: "blocked" },
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

    const advancedFilter = useMemo(() => getUserAdvancedFilter(items), [items]);

if (!ready) return <div className="p-4 text-slate-600">Yuklanmoqda...</div>;

  return (
    <CrudPageClient<UserRow>
      title="Foydalanuvchilar"
      description="Zakaz yuboruvchilar (sender) va qabul qiluvchilar (receiver)"
      rows={items}
      columns={columns as any}
      advancedFilter={advancedFilter}
      searchKeys={userSearchKeys}
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
        "F.I.Sh": r.fullName,
        "Turi": r.type,
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
