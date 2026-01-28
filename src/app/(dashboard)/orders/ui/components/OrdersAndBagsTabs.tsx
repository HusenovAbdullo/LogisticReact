"use client";

import React, { useMemo, useState } from "react";
import type { Courier, Order, Bag } from "../../model/types";
import { Card } from "./ui/Card";
import Button from "./ui/Button";
import { SlidersHorizontal, FileSpreadsheet, FileText } from "lucide-react";
import OrdersTable from "./OrdersTable";
import BagsTable from "./BagsTable";

type Props = {
  orders: Order[];
  bags: Bag[];
  couriers: Courier[];

  onOpenDetails: (id: string) => void;
  onOpenEdit: (id: string) => void;

  onExportPdf: () => void;
  onExportXlsx: () => void;
  onOpenFilters: () => void;

  // Bags actions
  onOpenBagDetails: (bagId: string) => void;
  onExportBagsPdf?: () => void;
  onExportBagsXlsx?: () => void;
};

type Tab = "orders" | "bags";

function tabBtn(active: boolean) {
  return active
    ? "bg-white shadow-sm ring-1 ring-slate-200 font-semibold text-slate-900"
    : "text-slate-600 hover:text-slate-900";
}

export default function OrdersAndBagsTabs({
  orders,
  bags,
  couriers,
  onOpenDetails,
  onOpenEdit,
  onExportPdf,
  onExportXlsx,
  onOpenFilters,
  onOpenBagDetails,
  onExportBagsPdf,
  onExportBagsXlsx,
}: Props) {
  const [tab, setTab] = useState<Tab>("orders");

  const headerTitle = tab === "orders" ? "Zakazlar" : "Qoplar";
  const headerSub =
    tab === "orders"
      ? "Zakazlar ro‘yxati va tezkor amallar"
      : "Kuryerga topshirilgan qoplar ro‘yxati";

  const count = tab === "orders" ? orders.length : bags.length;

  return (
    <Card className="overflow-hidden">
      {/* HEADER */}
      <div className="px-4 py-3 md:px-5 md:py-4 border-b border-slate-200 flex items-center gap-2">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            {headerTitle}
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700 ring-1 ring-slate-200">
              {count}
            </span>
          </div>
          <div className="text-xs text-slate-500">{headerSub}</div>
        </div>

        <div className="flex-1" />

        {/* Tabs */}
        <div className="inline-flex rounded-xl bg-slate-100 p-1 ring-1 ring-slate-200/70">
          <button
            className={`px-3 py-2 rounded-lg text-sm transition ${tabBtn(tab === "orders")}`}
            onClick={() => setTab("orders")}
            type="button"
          >
            Zakazlar
          </button>
          <button
            className={`px-3 py-2 rounded-lg text-sm transition ${tabBtn(tab === "bags")}`}
            onClick={() => setTab("bags")}
            type="button"
          >
            Qoplar
          </button>
        </div>

        {/* Actions (tabga qarab) */}
        <div className="ml-2 flex items-center gap-2 flex-wrap justify-end">
          {tab === "orders" ? (
            <>
              <Button variant="outline" size="sm" onClick={onOpenFilters}>
                <span className="inline-flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filtrlar
                </span>
              </Button>

              <Button variant="outline" size="sm" onClick={onExportXlsx}>
                <span className="inline-flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel
                </span>
              </Button>

              <Button variant="outline" size="sm" onClick={onExportPdf}>
                <span className="inline-flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  PDF
                </span>
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onExportBagsXlsx ?? (() => {})}
                disabled={!onExportBagsXlsx}
              >
                <span className="inline-flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Qoplar Excel
                </span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onExportBagsPdf ?? (() => {})}
                disabled={!onExportBagsPdf}
              >
                <span className="inline-flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Qoplar PDF
                </span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* BODY */}
      {tab === "orders" ? (
        <OrdersTable
          orders={orders}
          couriers={couriers}
          onOpenDetails={onOpenDetails}
          onOpenEdit={onOpenEdit}
          onExportPdf={onExportPdf}
          onExportXlsx={onExportXlsx}
          onOpenFilters={onOpenFilters}
        />
      ) : (
        <BagsTable bags={bags} couriers={couriers} onOpenDetails={onOpenBagDetails} />
      )}
    </Card>
  );
}
