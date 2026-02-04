"use client";

import React, { useCallback, useMemo } from "react";
import CrudPageClient from "../_components/CrudPageClient";
import { useCrudStore } from "../_lib/useCrud";
import { base, nowIso } from "../_lib/seed";
import type { Admin, Employee, Office, Shop, User, Warehouse } from "../_lib/types";

import { getUmumiyAdvancedFilter, umumiySearchKeys, type AnyRow } from "./filters";

function toNum(v: any): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function seedAdmin(): (Admin & any)[] {
  const t = nowIso();
  return [
    {
      ...base("admin"),
      fullName: "Admin Demo",
      phone: "+998 90 123 45 67",
      email: "admin@example.com",
      role: "Admin",
      roles: ["Admin"],
      status: "active",
      avatarUrl: "https://i.pravatar.cc/100?img=1",
      address: "Toshkent shahar",
      lat: 41.3111,
      lng: 69.2797,
      latitude: 41.3111,
      longitude: 69.2797,
      trackPoints: [{ lat: 41.3111, lng: 69.2797, at: t }],
      createdAt: t,
      updatedAt: t,
    },
  ];
}

function seedEmployee(): (Employee & any)[] {
  const t = nowIso();
  return [
    {
      ...base("employee"),
      fullName: "Xodim Demo",
      position: "Operator",
      office: "Yunusobod",
      phone: "+998 90 222 22 22",
      status: "active",
      avatarUrl: "https://i.pravatar.cc/100?img=47",
      address: "Toshkent shahar, Yunusobod tumani",
      lat: 41.3441,
      lng: 69.2846,
      latitude: 41.3441,
      longitude: 69.2846,
      trackPoints: [{ lat: 41.3441, lng: 69.2846, at: t }],
      createdAt: t,
      updatedAt: t,
    },
  ];
}

function seedUser(): (User & any)[] {
  const t = nowIso();
  return [
    {
      ...base("user"),
      fullName: "Foydalanuvchi Demo",
      type: "sender",
      phone: "+998 90 444 44 44",
      address: "Toshkent shahar",
      status: "active",
      avatarUrl: "https://i.pravatar.cc/100?img=5",
      lat: 41.3333,
      lng: 69.2833,
      latitude: 41.3333,
      longitude: 69.2833,
      trackPoints: [{ lat: 41.3333, lng: 69.2833, at: t }],
      createdAt: t,
      updatedAt: t,
    },
  ];
}

function seedShop(): (Shop & any)[] {
  const t = nowIso();
  return [
    {
      ...base("shop"),
      name: "Magazin Demo",
      owner: "Aliyev Anvar",
      phone: "+998 90 666 66 66",
      address: "Toshkent shahar, Sergeli tumani",
      status: "active",
      avatarUrl: "https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&w=200&q=60",
      lat: 41.2172,
      lng: 69.2236,
      latitude: 41.2172,
      longitude: 69.2236,
      trackPoints: [{ lat: 41.2172, lng: 69.2236, at: t }],
      createdAt: t,
      updatedAt: t,
    },
  ];
}

function seedWarehouse(): (Warehouse & any)[] {
  const t = nowIso();
  return [
    {
      ...base("warehouse"),
      name: "Sklad Demo",
      manager: "Saidov Diyor",
      phone: "+998 90 888 88 88",
      address: "Toshkent shahar, Olmazor tumani",
      status: "active",
      avatarUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=200&q=60",
      lat: 41.34,
      lng: 69.19,
      latitude: 41.34,
      longitude: 69.19,
      trackPoints: [{ lat: 41.34, lng: 69.19, at: t }],
      createdAt: t,
      updatedAt: t,
    },
  ];
}

function seedOffice(): (Office & any)[] {
  const t = nowIso();
  return [
    {
      ...base("office"),
      name: "Ofis Demo",
      manager: "Husenov Abdullo",
      phone: "+998 90 000 00 00",
      address: "Toshkent shahar, Yunusobod tumani",
      status: "active",
      avatarUrl: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=200&q=60",
      lat: 41.3441,
      lng: 69.2846,
      latitude: 41.3441,
      longitude: 69.2846,
      trackPoints: [{ lat: 41.3441, lng: 69.2846, at: t }],
      createdAt: t,
      updatedAt: t,
    },
  ];
}

export default function Page() {
  const { ready: aReady, items: admins } = useCrudStore<any>("malumotlar_adminlar", useCallback(seedAdmin, []));
  const { ready: eReady, items: employees } = useCrudStore<any>("malumotlar_xodimlar", useCallback(seedEmployee, []));
  const { ready: uReady, items: users } = useCrudStore<any>("malumotlar_foydalanuvchilar", useCallback(seedUser, []));
  const { ready: sReady, items: shops } = useCrudStore<any>("malumotlar_magazinlar", useCallback(seedShop, []));
  const { ready: wReady, items: warehouses } = useCrudStore<any>("malumotlar_skladlar", useCallback(seedWarehouse, []));
  const { ready: oReady, items: offices } = useCrudStore<any>("malumotlar_ofislar", useCallback(seedOffice, []));

  const ready = aReady && eReady && uReady && sReady && wReady && oReady;

  const rows: AnyRow[] = useMemo(() => {
    const mk = (kind: AnyRow["kind"], x: any, title: string): AnyRow => {
      const lat = toNum(x.lat ?? x.latitude);
      const lng = toNum(x.lng ?? x.longitude);
      return {
        id: String(x.id),
        kind,
        title,
        phone: x.phone,
        status: x.status,
        address: x.address,
        avatarUrl: x.avatarUrl,
        lat,
        lng,
        trackPoints: Array.isArray(x.trackPoints) ? x.trackPoints : [],
        raw: x,
      };
    };

    return [
      ...admins.map((x: any) => mk("Admin", x, x.fullName ?? "Admin")),
      ...employees.map((x: any) => mk("Xodim", x, x.fullName ?? "Xodim")),
      ...users.map((x: any) => mk("Foydalanuvchi", x, x.fullName ?? "Foydalanuvchi")),
      ...shops.map((x: any) => mk("Magazin", x, x.name ?? "Magazin")),
      ...warehouses.map((x: any) => mk("Sklad", x, x.name ?? "Sklad")),
      ...offices.map((x: any) => mk("Ofis", x, x.name ?? "Ofis")),
    ];
  }, [admins, employees, users, shops, warehouses, offices]);

  const columns = useMemo(
    () => [
      {
        key: "avatarUrl",
        header: "",
        render: (r: AnyRow) => (
          <img
            src={r.avatarUrl || "https://via.placeholder.com/80"}
            alt={r.title}
            className="h-10 w-10 rounded-2xl object-cover ring-1 ring-slate-200"
          />
        ),
      },
      {
        key: "title",
        header: "Nomi / F.I.Sh",
        render: (r: AnyRow) => (
          <div className="min-w-0">
            <div className="truncate font-medium text-slate-900">{r.title}</div>
            <div className="truncate text-xs text-slate-500">{r.kind}</div>
          </div>
        ),
      },
      { key: "phone", header: "Telefon", render: (r: AnyRow) => r.phone ?? "-" },
      { key: "address", header: "Manzil", render: (r: AnyRow) => r.address ?? "-", hideOnMobile: true },
      {
        key: "status",
        header: "Holat",
        render: (r: AnyRow) => (
          <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
            {r.status ?? "-"}
          </span>
        ),
      },
    ],
    []
  );

  const fields = useMemo(
    () => [
      // read-only page: form won't be used
      { key: "title", label: "title", hide: true },
    ] as any,
    []
  );

  const advancedFilter = useMemo(() => getUmumiyAdvancedFilter(rows), [rows]);


  if (!ready) return <div className="p-4 text-slate-600">Yuklanmoqda...</div>;

  return (
    <CrudPageClient<AnyRow>
      title="Umumiy"
      description="Ma’lumotlar bo‘limidagi barcha ro‘yxatlar (ko‘rish uchun)"
      rows={rows}
      columns={columns as any}
      advancedFilter={advancedFilter}
      searchKeys={umumiySearchKeys as any}
      fields={fields as any}
      hideCreate
      hideEditActions
      onCreate={() => {}}
      onUpdate={() => {}}
      detailsMap={(r) => ({
        "Turi": r.kind,
        "Nomi / F.I.Sh": r.title,
        "Telefon": r.phone ?? "-",
        "Manzil": r.address ?? "-",
        "Holat": r.status ?? "-",
        "Latitude": r.lat ?? "-",
        "Longitude": r.lng ?? "-",
        "ID": r.id,
      })}
    />
  );
}