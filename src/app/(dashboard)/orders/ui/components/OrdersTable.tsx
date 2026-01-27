"use client";

import React, { useMemo } from "react";
import type { Courier, Order } from "../../model/types";
import { STATUS_BADGE, STATUS_LABEL, SLA_BADGE } from "../../model/constants";
import { money, fmtDate } from "../../lib/format";
import Button from "./ui/Button";
import { Card } from "./ui/Card";
import { useOrders } from "../state/OrdersProvider";
import { Eye, Pencil, SlidersHorizontal, FileSpreadsheet, FileText } from "lucide-react";

type Props = {
  orders: Order[];
  couriers: Courier[];
  onOpenDetails: (id: string) => void;
  onOpenEdit: (id: string) => void;
  onExportPdf: () => void;
  onExportXlsx: () => void;
  onOpenFilters: () => void;
};

export default function OrdersTable({
  orders,
  couriers,
  onOpenDetails,
  onOpenEdit,
  onExportPdf,
  onExportXlsx,
  onOpenFilters,
}: Props) {
  const { selectedIds, setSelectedIds, columns, sort, setSort } = useOrders();

  const courierLabel = (id?: string | null) => {
    if (!id) return "—";
    const c = couriers.find((x) => x.id === id);
    return c ? c.name : "—";
  };

  const allChecked =
    orders.length > 0 && orders.every((o) => selectedIds.includes(o.id));

  const toggleAll = () => {
    if (allChecked) {
      setSelectedIds(selectedIds.filter((id) => !orders.some((o) => o.id === id)));
    } else {
      const add = orders.map((o) => o.id).filter((id) => !selectedIds.includes(id));
      setSelectedIds([...selectedIds, ...add]);
    }
  };

  const toggleOne = (id: string) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter((x) => x !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  const sortBtn = (key: any, label: string) => {
    const active = sort.key === key;
    const nextDir = active ? (sort.dir === "asc" ? "desc" : "asc") : "desc";

    return (
      <button
        type="button"
        className={`inline-flex items-center gap-1 font-semibold ${
          active ? "text-slate-900" : "text-slate-600"
        }`}
        onClick={() => setSort({ key, dir: nextDir })}
      >
        {label}
        {active ? (
          <span className="text-xs">{sort.dir === "asc" ? "▲" : "▼"}</span>
        ) : null}
      </button>
    );
  };

  // "Ma’lumot topilmadi" row uchun colSpan ni har doim to‘g‘ri qilish
  const colCount = useMemo(() => {
    const base = [
      columns.select,
      columns.code,
      columns.barcode,
      columns.status,
      columns.sla,
      columns.sender, // kichik ekranda yashiriladi, lekin DOM'da bor -> colSpan hisobiga kiradi
      columns.recipient,
      columns.city,
      columns.total,
      columns.actions,
    ].filter(Boolean).length;

    return Math.max(base, 1);
  }, [columns]);

  // Kichik desktopda yashirish uchun breakpoint (sizga kerak bo‘lsa md qilib qo‘yishingiz mumkin)
  const HIDE_ON_SMALL = "hidden lg:table-cell";

  return (
    <Card className="overflow-hidden">
      {/* HEADER */}
      <div className="px-4 py-3 md:px-5 md:py-4 border-b border-slate-200 flex items-center gap-2">
        <div>
          <div className="text-sm font-semibold text-slate-900">Jadval</div>
          <div className="text-xs text-slate-500">
            Zakazlar ro‘yxati va tezkor amallar
          </div>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Button variant="outline" size="sm" onClick={onOpenFilters}>
            <span className="inline-flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filtrlar
            </span>
          </Button>

          <Button variant="outline" size="sm" onClick={onExportXlsx}>
            <span className="inline-flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Excel yuklab olish
            </span>
          </Button>

          <Button variant="outline" size="sm" onClick={onExportPdf}>
            <span className="inline-flex items-center gap-2">
              <FileText className="h-4 w-4" />
              PDF yuklab olish
            </span>
          </Button>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="min-w-[1100px] w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-slate-600">
              {columns.select && (
                <th className="p-3 w-[52px]">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={toggleAll}
                    aria-label="Select all"
                  />
                </th>
              )}

              {columns.code && (
                <th className="p-3 text-left">{sortBtn("createdAt", "Kod")}</th>
              )}

              {columns.barcode && <th className="p-3 text-left">Barcode</th>}

              {columns.status && (
                <th className="p-3 text-left">{sortBtn("status", "Status")}</th>
              )}

              {columns.sla && <th className="p-3 text-left">SLA</th>}

              {/* KICHIK EKRANDA YASHIRILADI */}
              {columns.sender && (
                <th className={`p-3 text-left ${HIDE_ON_SMALL}`}>Yuboruvchi</th>
              )}
              {columns.recipient && (
                <th className={`p-3 text-left ${HIDE_ON_SMALL}`}>Qabul qiluvchi</th>
              )}

              {columns.city && <th className="p-3 text-left">Shahar</th>}

              {columns.total && (
                <th className="p-3 text-right">{sortBtn("total", "Jami")}</th>
              )}

              {columns.actions && <th className="p-3 text-right">Amallar</th>}
            </tr>
          </thead>

          <tbody>
            {orders.map((o) => (
              <tr
                key={o.id}
                className="border-t border-slate-200 hover:bg-slate-50/60"
              >
                {columns.select && (
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(o.id)}
                      onChange={() => toggleOne(o.id)}
                      aria-label={`Select ${o.code}`}
                    />
                  </td>
                )}

                {columns.code && (
                  <td className="p-3">
                    <button
                      type="button"
                      className="font-semibold text-slate-900 hover:underline"
                      onClick={() => onOpenDetails(o.id)}
                    >
                      {o.code}
                    </button>
                    <div className="text-xs text-slate-500">{fmtDate(o.createdAt)}</div>
                  </td>
                )}

                {columns.barcode && <td className="p-3">{o.barcode}</td>}

                {columns.status && (
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs ring-1 ${
                        STATUS_BADGE[o.status]
                      }`}
                    >
                      {STATUS_LABEL[o.status]}
                    </span>
                  </td>
                )}

                {columns.sla && (
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs ring-1 ${
                        SLA_BADGE[o.slaRisk]
                      }`}
                    >
                      {o.slaRisk === "low"
                        ? "Past"
                        : o.slaRisk === "medium"
                        ? "O‘rtacha"
                        : "Yuqori"}
                    </span>
                  </td>
                )}

                {/* KICHIK EKRANDA YASHIRILADI */}
                {columns.sender && (
                  <td className={`p-3 ${HIDE_ON_SMALL}`}>
                    <div className="font-medium text-slate-900 truncate max-w-[260px]">
                      {o.sender.name}
                    </div>
                    <div className="text-xs text-slate-500 truncate max-w-[260px]">
                      {o.sender.city} · {o.sender.phone}
                    </div>
                  </td>
                )}

                {columns.recipient && (
                  <td className={`p-3 ${HIDE_ON_SMALL}`}>
                    <div className="font-medium text-slate-900 truncate max-w-[260px]">
                      {o.recipient.name}
                    </div>
                    <div className="text-xs text-slate-500 truncate max-w-[260px]">
                      {o.recipient.city} · {o.recipient.phone}
                    </div>
                  </td>
                )}

                {columns.city && <td className="p-3">{o.recipient.city}</td>}

                {columns.total && (
                  <td className="p-3 text-right font-semibold">
                    {money(o.total.amount, o.total.currency)}
                  </td>
                )}

                {columns.actions && (
                  <td className="p-3 text-right">
                    <div className="inline-flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onOpenDetails(o.id)}
                        aria-label="Details"
                      >
                        <span className="inline-flex items-center">
                          <Eye className="h-4 w-4" />
                        </span>
                      </Button>

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onOpenEdit(o.id)}
                        aria-label="Edit"
                      >
                        <span className="inline-flex items-center">
                          <Pencil className="h-4 w-4" />
                        </span>
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            ))}

            {!orders.length && (
              <tr>
                <td className="p-6 text-center text-slate-500" colSpan={colCount}>
                  Ma’lumot topilmadi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
