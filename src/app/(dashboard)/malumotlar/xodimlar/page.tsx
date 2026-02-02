"use client";

import React, { useCallback, useMemo } from "react";
import CrudPageClient from "../_components/CrudPageClient";
import { useCrudStore } from "../_lib/useCrud";
import { base, nowIso } from "../_lib/seed";
import type { Employee } from "../_lib/types";

function seed(): Employee[] {
  const mk = (
    fullName: string,
    position: string,
    office: string,
    phone: string,
    status: Employee["status"] = "active"
  ): Employee => ({
    ...base("employee"),
    fullName,
    position,
    office,
    phone,
    status,
  });
  return [
    mk("Rahmonov Sodiq", "Operator", "Yunusobod", "+998 90 222 22 22"),
    mk("Kadirov Elyor", "Kuryer", "Chilonzor", "+998 93 333 33 33", "inactive"),
  ];
}

export default function Page() {
  const seedFn = useCallback(seed, []);
  const { ready, items, api } = useCrudStore<Employee>("malumotlar_xodimlar", seedFn);

  const columns = useMemo(
    () => [
      { key: "fullName", header: "F.I.Sh", render: (r: Employee) => <span className="font-medium text-slate-900">{r.fullName}</span> },
      { key: "position", header: "Lavozim", render: (r: Employee) => r.position ?? "-" },
      { key: "office", header: "Ofis", render: (r: Employee) => r.office ?? "-", hideOnMobile: true },
      { key: "phone", header: "Telefon", render: (r: Employee) => r.phone ?? "-" },
      {
        key: "status",
        header: "Holat",
        render: (r: Employee) => (
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
      { key: "fullName", label: "F.I.Sh", required: true },
      { key: "phone", label: "Telefon", type: "tel" },
      { key: "position", label: "Lavozim" },
      { key: "office", label: "Ofis" },
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
    <CrudPageClient<Employee>
      title="Xodimlar"
      description="Xodimlar ro‘yxati"
      rows={items}
      columns={columns as any}
      searchKeys={["fullName", "phone", "position", "office", "status"]}
      fields={fields as any}
      onCreate={(payload) => {
        const t = nowIso();
        api.create({ ...(payload as any), createdAt: t, updatedAt: t });
      }}
      onUpdate={(id, patch) => api.update(id, { ...patch, updatedAt: nowIso() })}
      onRemove={(id) => api.remove(id)}
      detailsMap={(r) => ({
        "F.I.Sh": r.fullName,
        "Lavozim": r.position,
        "Ofis": r.office,
        "Telefon": r.phone,
        "Holat": r.status,
        "Yaratilgan": r.createdAt,
        "Yangilangan": r.updatedAt,
        "ID": r.id,
      })}
    />
  );
}
