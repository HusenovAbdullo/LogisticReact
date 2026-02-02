"use client";

import React, { useCallback, useMemo } from "react";
import CrudPageClient from "../_components/CrudPageClient";
import { useCrudStore } from "../_lib/useCrud";
import { base, nowIso } from "../_lib/seed";
import type { Warehouse } from "../_lib/types";

function seed(): Warehouse[] {
  const mk = (name: string, manager: string, phone: string, address: string, status: Warehouse["status"] = "active"): Warehouse => ({
    ...base("warehouse"),
    name,
    manager,
    phone,
    address,
    status,
  });
  return [
    mk("Sklad A", "Rasulov Komil", "+998 90 888 88 88", "Toshkent, Olmazor"),
    mk("Sklad B", "Azimov Sardor", "+998 97 999 99 99", "Andijon, Asaka", "inactive"),
  ];
}

export default function Page() {
  const seedFn = useCallback(seed, []);
  const { ready, items, api } = useCrudStore<Warehouse>("malumotlar_skladlar", seedFn);

  const columns = useMemo(
    () => [
      { key: "name", header: "Nomi", render: (r: Warehouse) => <span className="font-medium text-slate-900">{r.name}</span> },
      { key: "manager", header: "Mas'ul", render: (r: Warehouse) => r.manager ?? "-", hideOnMobile: true },
      { key: "phone", header: "Telefon", render: (r: Warehouse) => r.phone ?? "-" },
      { key: "address", header: "Manzil", render: (r: Warehouse) => r.address ?? "-", hideOnMobile: true },
      {
        key: "status",
        header: "Holat",
        render: (r: Warehouse) => (
          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${r.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}`}>
            {r.status}
          </span>
        ),
      },
    ],
    []
  );

  const fields = useMemo(
    () => [
      { key: "name", label: "Nomi", required: true },
      { key: "manager", label: "Mas'ul" },
      { key: "phone", label: "Telefon", type: "tel" },
      { key: "address", label: "Manzil" },
      {
        key: "status",
        label: "Holat",
        type: "select",
        options: [
          { value: "active", label: "active" },
          { value: "inactive", label: "inactive" },
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
    <CrudPageClient<Warehouse>
      title="Skladlar"
      description="Skladlar ro‘yxati"
      rows={items}
      columns={columns as any}
      searchKeys={["name", "manager", "phone", "address", "status"]}
      fields={fields as any}
      onCreate={(payload) => {
        const t = nowIso();
        api.create({ ...(payload as any), createdAt: t, updatedAt: t });
      }}
      onUpdate={(id, patch) => api.update(id, { ...patch, updatedAt: nowIso() })}
      onRemove={(id) => api.remove(id)}
      detailsMap={(r) => ({
        "Nomi": r.name,
        "Mas'ul": r.manager,
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
