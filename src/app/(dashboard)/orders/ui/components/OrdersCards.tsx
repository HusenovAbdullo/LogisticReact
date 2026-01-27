"use client";

import React from "react";
import type { Courier, Order } from "../../model/types";
import { STATUS_BADGE, STATUS_LABEL, SLA_BADGE } from "../../model/constants";
import { money, fmtDate } from "../../lib/format";
import Button from "./ui/Button";
import { Card } from "./ui/Card";

export default function OrdersCards({
  orders,
  couriers,
  onOpenDetails,
  onOpenEdit,
}: {
  orders: Order[];
  couriers: Courier[];
  onOpenDetails: (id: string) => void;
  onOpenEdit: (id: string) => void;
}) {
  const courierLabel = (id?: string | null) => {
    if (!id) return "—";
    const c = couriers.find(x => x.id === id);
    return c ? c.name : "—";
  };

  return (
    <div className="grid gap-3">
      {orders.map(o => (
        <Card key={o.id} className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-semibold text-slate-900 truncate">{o.code} <span className="text-slate-400">/</span> {o.barcode}</div>
              <div className="text-xs text-slate-500">{fmtDate(o.createdAt)}</div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs ring-1 ${STATUS_BADGE[o.status]}`}>
                {STATUS_LABEL[o.status]}
              </span>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs ring-1 ${SLA_BADGE[o.slaRisk]}`}>
                SLA: {o.slaRisk}
              </span>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div>
              <div className="text-xs text-slate-500">Yuboruvchi</div>
              <div className="font-medium truncate">{o.sender.name}</div>
              <div className="text-xs text-slate-500 truncate">{o.sender.city} · {o.sender.phone}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Qabul qiluvchi</div>
              <div className="font-medium truncate">{o.recipient.name}</div>
              <div className="text-xs text-slate-500 truncate">{o.recipient.city} · {o.recipient.phone}</div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500">Kuryer</div>
              <div className="text-sm font-medium">{courierLabel(o.courierId ?? null)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500">Jami</div>
              <div className="text-sm font-semibold">{money(o.total.amount, o.total.currency)}</div>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <Button className="flex-1" variant="outline" onClick={() => onOpenDetails(o.id)}>Ko‘rish</Button>
            <Button className="flex-1" variant="secondary" onClick={() => onOpenEdit(o.id)}>Tahrirlash</Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
