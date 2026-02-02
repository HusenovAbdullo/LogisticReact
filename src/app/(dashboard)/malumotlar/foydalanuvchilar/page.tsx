"use client";

import React, { useCallback, useMemo } from "react";
import CrudPageClient from "../_components/CrudPageClient";
import { useCrudStore } from "../_lib/useCrud";
import { base, nowIso } from "../_lib/seed";
import type { User } from "../_lib/types";

function seed(): User[] {
  const mk = (
    fullName: string,
    type: User["type"],
    phone: string,
    address: string,
    status: User["status"] = "active"
  ): User => ({
    ...base("user"),
    fullName,
    type,
    phone,
    address,
    status,
  });
  return [
    mk("Karimova Dilnoza", "sender", "+998 90 444 44 44", "Toshkent, Yunusobod"),
    mk("Nazarov Shavkat", "receiver", "+998 97 555 55 55", "Samarqand, Bulung'ur", "active"),
  ];
}

export default function Page() {
  const seedFn = useCallback(seed, []);
  const { ready, items, api } = useCrudStore<User>("malumotlar_foydalanuvchilar", seedFn);

  const columns = useMemo(
    () => [
      { key: "fullName", header: "F.I.Sh", render: (r: User) => <span className="font-medium text-slate-900">{r.fullName}</span> },
      {
        key: "type",
        header: "Turi",
        render: (r: User) => (
          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${r.type === "sender" ? "bg-indigo-100 text-indigo-700" : "bg-amber-100 text-amber-700"}`}>
            {r.type}
          </span>
        ),
      },
      { key: "phone", header: "Telefon", render: (r: User) => r.phone ?? "-" },
      { key: "address", header: "Manzil", render: (r: User) => r.address ?? "-", hideOnMobile: true },
      {
        key: "status",
        header: "Holat",
        render: (r: User) => (
          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${r.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
            {r.status}
          </span>
        ),
      },
    ],
    []
  );

  const fields = useMemo(
    () => [
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
      { key: "address", label: "Manzil" },
      {
        key: "status",
        label: "Holat",
        type: "select",
        options: [
          { value: "active", label: "active" },
          { value: "blocked", label: "blocked" },
        ],
      },
      { key: "createdAt", label: "Yaratilgan", hide: true },
      { key: "updatedAt", label: "Yangilangan", hide: true },
      { key: "id", label: "ID", hide: true },
    ] as any,
    []
  );

  if (!ready) return <div className="p-4 text-slate-600">Yuklanmoqda...</div>;

  return (
    <CrudPageClient<User>
      title="Foydalanuvchilar"
      description="Zakaz yuboruvchilar (sender) va qabul qiluvchilar (receiver)"
      rows={items}
      columns={columns as any}
      searchKeys={["fullName", "phone", "type", "address", "status"]}
      fields={fields as any}
      hideCreate
      onCreate={() => {
        /* create hidden */
      }}
      onUpdate={(id, patch) => api.update(id, { ...patch, updatedAt: nowIso() })}
      detailsMap={(r) => ({
        "F.I.Sh": r.fullName,
        "Turi": r.type,
        "Telefon": r.phone,
        "Manzil": r.address,
        "Holat": r.status,
        "Yaratilgan": r.createdAt,
        "Yangilangan": r.updatedAt,
        "ID": r.id,
      })}
    />
  );
}
