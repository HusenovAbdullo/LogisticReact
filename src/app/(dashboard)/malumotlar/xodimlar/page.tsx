"use client";

import React, { useCallback, useMemo } from "react";
import CrudPageClient from "../_components/CrudPageClient";
import { useCrudStore } from "../_lib/useCrud";
import { base, nowIso } from "../_lib/seed";
import type { Employee } from "../_lib/types";

import { getEmployeeAdvancedFilter, employeeSearchKeys, type EmployeeRow } from "./filters";

function toNum(v: any): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function seed(): EmployeeRow[] {
  const mk = (
    fullName: string,
    position: string,
    office: string,
    phone: string,
    avatarUrl: string,
    address: string,
    lat: number,
    lng: number,
    status: Employee["status"] = "active"
  ): EmployeeRow => {
    const t = nowIso();
    return {
      ...base("employee"),
      fullName,
      position,
      office,
      phone,
      status,
      avatarUrl,
      address,
      lat,
      lng,
      latitude: lat,
      longitude: lng,
      trackPoints: [{ lat, lng, at: t }],
    };
  };

  return [
    mk(
      "Rahmonov Sodiq",
      "Operator",
      "Yunusobod",
      "+998 90 222 22 22",
      "https://i.pravatar.cc/100?img=47",
      "Toshkent shahar, Yunusobod tumani",
      41.3441,
      69.2846,
      "active"
    ),
    mk(
      "Kadirov Elyor",
      "Kuryer",
      "Chilonzor",
      "+998 93 333 33 33",
      "https://i.pravatar.cc/100?img=16",
      "Toshkent shahar, Chilonzor tumani",
      41.272,
      69.209,
      "inactive"
    ),
  ];
}

export default function Page() {
  const seedFn = useCallback(seed, []);
  const { ready, items, api } = useCrudStore<EmployeeRow>("malumotlar_xodimlar", seedFn);

  const columns = useMemo(
    () => [
      {
        key: "avatarUrl",
        header: "",
        render: (r: EmployeeRow) => (
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
        render: (r: EmployeeRow) => (
          <div className="min-w-0">
            <div className="truncate font-medium text-slate-900">{r.fullName}</div>
            <div className="truncate text-xs text-slate-500">{r.position ?? "-"}</div>
          </div>
        ),
      },
      { key: "office", header: "Ofis", render: (r: EmployeeRow) => r.office ?? "-", hideOnMobile: true },
      { key: "phone", header: "Telefon", render: (r: EmployeeRow) => r.phone ?? "-" },
      { key: "address", header: "Manzil", render: (r: EmployeeRow) => r.address ?? "-", hideOnMobile: true },
      {
        key: "status",
        header: "Holat",
        render: (r: EmployeeRow) => (
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
        { key: "fullName", label: "F.I.Sh", placeholder: "Masalan: Islomov Aziz", required: true },
        { key: "phone", label: "Telefon", type: "tel", placeholder: "+998 ..." },
        { key: "position", label: "Lavozim", placeholder: "Operator / Kuryer / ..." },
        { key: "office", label: "Ofis", placeholder: "Yunusobod / Chilonzor / ..." },
        { key: "address", label: "Manzil", type: "textarea", colSpan: 2 },
        { key: "telegram", label: "Telegram", placeholder: "@username" },
        { key: "note", label: "Izoh", type: "textarea", colSpan: 2 },
        { key: "lat", label: "Latitude", type: "number", placeholder: "41.33" },
        { key: "lng", label: "Longitude", type: "number", placeholder: "69.28" },
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

  // Filter modal (page-level). Qidirish inputini ko‘rsatmaymiz — faqat modal orqali filtrlash.
  const advancedFilter = useMemo(() => getEmployeeAdvancedFilter(items), [items]);


  if (!ready) return <div className="p-4 text-slate-600">Yuklanmoqda...</div>;

  return (
    <CrudPageClient<EmployeeRow>
      title="Xodimlar"
      description="Xodimlar ro‘yxati"
      rows={items}
      columns={columns as any}
      advancedFilter={advancedFilter}
      searchKeys={employeeSearchKeys}
      tableOptions={{ showSearch: false }}
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
        "Lavozim": r.position,
        "Ofis": r.office,
        "Telefon": r.phone,
        "Manzil": (r as any).address ?? "-",
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
