"use client";

import React from "react";
import Button from "./ui/Button";
import { Eye } from "lucide-react";

type BagStatus = "created" | "handover";

export type Bag = {
  id: string;
  bagNo: string;
  courierId: string;
  orderIds: string[];
  createdAt: string;
  status: BagStatus;
};

type Props = {
  bags: Bag[];
  couriers: any[];
  onOpenDetails: (bagId: string) => void;
};

export default function BagsSection({ bags, couriers, onOpenDetails }: Props) {
  const courierName = (id: string) => couriers.find((c: any) => c.id === id)?.name ?? "—";

  return (
    <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-slate-600">
              <th className="p-3 text-left">Qop raqami</th>
              <th className="p-3 text-left">Kuryer</th>
              <th className="p-3 text-left">Sana</th>
              <th className="p-3 text-left">Zakazlar</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-right">Amallar</th>
            </tr>
          </thead>

          <tbody>
            {bags.map((b) => (
              <tr key={b.id} className="border-t border-slate-200 hover:bg-slate-50/60">
                <td className="p-3">
                  <div className="font-semibold text-slate-900">{b.bagNo}</div>
                  <div className="text-xs text-slate-500">{b.id.slice(0, 8)}</div>
                </td>

                <td className="p-3">
                  <div className="text-slate-900 font-medium">{courierName(b.courierId)}</div>
                  <div className="text-xs text-slate-500">ID: {b.courierId}</div>
                </td>

                <td className="p-3 text-slate-700">{new Date(b.createdAt).toLocaleString()}</td>

                <td className="p-3">
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 ring-1 ring-slate-200">
                    {b.orderIds.length} ta
                  </span>
                </td>

                <td className="p-3">
                  <span
                    className={[
                      "inline-flex items-center rounded-full px-3 py-1 text-xs ring-1",
                      b.status === "handover"
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                        : "bg-slate-50 text-slate-700 ring-slate-200",
                    ].join(" ")}
                  >
                    {b.status === "handover" ? "Topshirildi" : "Yaratildi"}
                  </span>
                </td>

                <td className="p-3 text-right">
                  <Button size="sm" variant="outline" onClick={() => onOpenDetails(b.id)}>
                    <span className="inline-flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Ko‘rish
                    </span>
                  </Button>
                </td>
              </tr>
            ))}

            {!bags.length && (
              <tr>
                <td className="p-8 text-center text-slate-500" colSpan={6}>
                  Hali qoplar yo‘q. Qoplar “Kuryerga topshirish” orqali yaratiladi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
