"use client";

import React, { useMemo, useState } from "react";

export type Column<T> = {
  key: string;
  header: React.ReactNode;
  render: (row: T) => React.ReactNode;
  className?: string;
  hideOnMobile?: boolean;
};

export default function DataTable<T extends { id: string }>({
  rows,
  columns,
  onRowClick,
  rowActions,
  searchKeys,
}: {
  rows: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  rowActions?: (row: T) => React.ReactNode;
  searchKeys?: (keyof T)[];
}) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return rows;
    const keys = searchKeys ?? ([] as (keyof T)[]);
    return rows.filter((r) => {
      if (keys.length === 0) {
        return JSON.stringify(r).toLowerCase().includes(query);
      }
      return keys.some((k) => String(r[k] ?? "").toLowerCase().includes(query));
    });
  }, [q, rows, searchKeys]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-600">
          Jami: <span className="font-medium text-slate-900">{filtered.length}</span>
        </div>
        <div className="w-full sm:w-80">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Qidirish..."
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-600">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={`px-4 py-3 font-semibold ${c.className ?? ""} ${c.hideOnMobile ? "hidden sm:table-cell" : ""}`}
                >
                  {c.header}
                </th>
              ))}
              {rowActions ? <th className="px-4 py-3 text-right">Amallar</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((r) => (
              <tr
                key={r.id}
                className={`hover:bg-slate-50 ${onRowClick ? "cursor-pointer" : ""}`}
                onClick={onRowClick ? () => onRowClick(r) : undefined}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={`px-4 py-3 align-middle ${c.className ?? ""} ${c.hideOnMobile ? "hidden sm:table-cell" : ""}`}
                  >
                    {c.render(r)}
                  </td>
                ))}
                {rowActions ? (
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    {rowActions(r)}
                  </td>
                ) : null}
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (rowActions ? 1 : 0)}
                  className="px-4 py-10 text-center text-slate-500"
                >
                  Ma’lumot topilmadi.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
