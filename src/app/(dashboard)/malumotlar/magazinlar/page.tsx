"use client";

import React, { useCallback, useMemo } from "react";
import CrudPageClient from "../_components/CrudPageClient";
import { useCrudStore } from "../_lib/useCrud";
import { base, nowIso } from "../_lib/seed";
import type { Shop } from "../_lib/types";

function seed(): Shop[] {
  const mk = (name: string, owner: string, phone: string, address: string, status: Shop["status"] = "active"): Shop => ({
    ...base("shop"),
    name,
    owner,
    phone,
    address,
    status,
  });
  return [
    mk("Magazin 1", "Aliyev Anvar", "+998 90 666 66 66", "Toshkent, Sergeli"),
    mk("Magazin 2", "Tursunov Jamshid", "+998 93 777 77 77", "Buxoro, G'ijduvon", "inactive"),
  ];
}

export default function Page() {
  const seedFn = useCallback(seed, []);
  const { ready, items, api } = useCrudStore<Shop>("malumotlar_magazinlar", seedFn);

  const columns = useMemo(
    () => [
      { key: "name", header: "Nomi", render: (r: Shop) => <span className="font-medium text-slate-900">{r.name}</span> },
      { key: "owner", header: "Egasi", render: (r: Shop) => r.owner ?? "-", hideOnMobile: true },
      { key: "phone", header: "Telefon", render: (r: Shop) => r.phone ?? "-" },
      { key: "address", header: "Manzil", render: (r: Shop) => r.address ?? "-", hideOnMobile: true },
      {
        key: "status",
        header: "Holat",
        render: (r: Shop) => (
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
      { key: "owner", label: "Egasi" },
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
    <CrudPageClient<Shop>
      title="Magazinlar"
      description="Magazinlar ro‘yxati"
      rows={items}
      columns={columns as any}
      searchKeys={["name", "owner", "phone", "address", "status"]}
      fields={fields as any}
      onCreate={(payload) => {
        const t = nowIso();
        api.create({ ...(payload as any), createdAt: t, updatedAt: t });
      }}
      onUpdate={(id, patch) => api.update(id, { ...patch, updatedAt: nowIso() })}
      onRemove={(id) => api.remove(id)}
      detailsMap={(r) => ({
        "Nomi": r.name,
        "Egasi": r.owner,
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
