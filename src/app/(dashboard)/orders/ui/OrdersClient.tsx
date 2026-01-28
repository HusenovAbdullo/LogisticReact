// app/(dashboard)/orders/ui/OrdersClient.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { OrdersProvider, useOrders } from "./state/OrdersProvider";

import BulkBar from "./components/BulkBar";
import OrdersTable from "./components/OrdersTable";
import OrdersCards from "./components/OrdersCards";
import Pagination from "./components/Pagination";
import DetailsDrawer from "./components/DetailsDrawer";
import OrderFormModal from "./components/OrderFormModal";
import Toast from "./components/ui/Toast";
import FiltersModal from "./components/FiltersModal";
import Button from "./components/ui/Button";
import AssignToCourierModal from "./components/AssignToCourierModal";

import BagsSection, { Bag as BagType } from "./components/BagsSection";
import BagDetailsModal from "./components/BagDetailsModal";

import {
  SlidersHorizontal,
  FileSpreadsheet,
  FileText,
  Boxes,
  Package,
  ListChecks,
} from "lucide-react";

/* =========================
 * Helpers
 * ========================= */
function escapeHtml(v: unknown) {
  const s = String(v ?? "");
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function nextBagNo(n: number) {
  return `BAG-${String(n).padStart(6, "0")}`;
}

function uid() {
  // crypto.randomUUID() yo‘q bo‘lsa fallback
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c: any = globalThis.crypto;
  return c?.randomUUID ? c.randomUUID() : `bag_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

/* =========================
 * UI atoms
 * ========================= */
function StatPill({
  icon,
  label,
  value,
  tone = "slate",
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  tone?: "slate" | "emerald" | "sky" | "amber";
}) {
  const styles =
    tone === "emerald"
      ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
      : tone === "sky"
        ? "bg-sky-50 text-sky-800 ring-sky-200"
        : tone === "amber"
          ? "bg-amber-50 text-amber-900 ring-amber-200"
          : "bg-slate-50 text-slate-800 ring-slate-200";

  return (
    <div className={`rounded-2xl px-3 py-2 ring-1 ${styles}`}>
      <div className="flex items-center gap-2">
        <span className="shrink-0">{icon}</span>
        <div className="min-w-0">
          <div className="text-[11px] opacity-70 leading-4">{label}</div>
          <div className="text-sm font-semibold leading-5 truncate">{value}</div>
        </div>
      </div>
    </div>
  );
}

function Segmented({
  value,
  onChange,
  items,
}: {
  value: string;
  onChange: (v: string) => void;
  items: { key: string; label: React.ReactNode }[];
}) {
  return (
    <div className="inline-flex rounded-2xl bg-slate-100 p-1 ring-1 ring-slate-200/70">
      {items.map((it) => {
        const active = it.key === value;
        return (
          <button
            key={it.key}
            type="button"
            onClick={() => onChange(it.key)}
            className={[
              "px-3 py-2 rounded-xl text-sm transition inline-flex items-center gap-2",
              active
                ? "bg-white shadow-sm ring-1 ring-slate-200 font-semibold text-slate-900"
                : "text-slate-600 hover:text-slate-900",
            ].join(" ")}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

/* =========================
 * Screen
 * ========================= */
function Screen() {
  const { repo, query, sort, page, pageSize, setPage, setPageSize, data, setData } = useOrders();

  const [couriers, setCouriers] = useState<any[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [detailsOrder, setDetailsOrder] = useState<any>(null);

  const [editId, setEditId] = useState<string | null>(null);
  const [editOrder, setEditOrder] = useState<any>(null);

  const [filtersOpen, setFiltersOpen] = useState(false);

  // tabs
  const [tab, setTab] = useState<"orders" | "bags">("orders");

  // assign modal
  const [assignOpen, setAssignOpen] = useState(false);

  // bags + details modal
  const [bags, setBags] = useState<BagType[]>([]);
  const [bagDetailsOpen, setBagDetailsOpen] = useState(false);
  const [activeBagId, setActiveBagId] = useState<string | null>(null);

  const [toast, setToast] = useState<{ open: boolean; type: any; message: string }>({
    open: false,
    type: "info",
    message: "",
  });
  const showToast = (t: { type: any; message: string }) => setToast({ open: true, ...t });

  const courierName = (id: string) => couriers.find((c: any) => c.id === id)?.name ?? "—";

  const activeBag = useMemo(
    () => bags.find((b) => b.id === activeBagId) ?? null,
    [bags, activeBagId],
  );

  const orders = data?.items ?? [];

  const load = async () => {
    setLoading(true);
    try {
      const [c, list] = await Promise.all([
        repo.listCouriers(),
        repo.listOrders(query, sort, page, pageSize),
      ]);

      setCouriers(c);
      setData(list);

      const cs = Array.from(
        new Set(
          (list.items ?? [])
            .flatMap((o: any) => [o.sender?.city, o.recipient?.city])
            .filter(Boolean),
        ),
      ).sort();

      setCities(cs);
    } catch (e: any) {
      showToast({ type: "error", message: e?.message || "Yuklashda xatolik." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(query), JSON.stringify(sort), page, pageSize]);

  const openDetails = async (id: string) => {
    setDetailsId(id);
    try {
      const o = await repo.getOrder(id);
      setDetailsOrder(o);
    } catch (e: any) {
      showToast({ type: "error", message: e?.message || "Zakaz ma’lumotini olishda xatolik." });
    }
  };

  const openEdit = async (id: string) => {
    setEditId(id);
    try {
      const o = await repo.getOrder(id);
      setEditOrder(o);
    } catch (e: any) {
      showToast({ type: "error", message: e?.message || "Zakazni tahrirlash uchun olishda xatolik." });
    }
  };

  const submitEdit = async (payload: any) => {
    try {
      if (!payload?.id) throw new Error("ID yo‘q");
      await repo.updateOrder({
        id: payload.id,
        status: payload.status,
        courierId: payload.courierId,
        notes: payload.notes,
      } as any);

      showToast({ type: "success", message: "Zakaz yangilandi." });

      setEditId(null);
      setEditOrder(null);
      await load();
    } catch (e: any) {
      showToast({ type: "error", message: e?.message || "Zakazni yangilashda xatolik." });
    }
  };

  /* =========================
   * Exports (Zakazlar)
   * ========================= */
  const exportRows = useMemo(() => {
    return orders.map((o: any) => ({
      Kod: o.code,
      Barcode: o.barcode,
      Status: o.status,
      SLA: o.slaRisk,
      Reja: `${o.scheduledDate || ""} ${o.timeFrom || ""}-${o.timeTo || ""}`.trim(),
      Yuboruvchi: o?.sender?.name || "",
      QabulQiluvchi: o?.recipient?.name || "",
      Shahar: o?.recipient?.city || "",
      Kuryer: o?.courierName || o?.courier?.name || "",
      Jami: o?.total?.amount ?? "",
      Valyuta: o?.total?.currency ?? "",
    }));
  }, [orders]);

  const exportXlsx = async () => {
    if (!exportRows.length) return showToast({ type: "info", message: "Eksport uchun ma'lumot yo‘q." });
    try {
      const mod: any = await import("xlsx");
      const XLSX = mod?.default ?? mod;

      const ws = XLSX.utils.json_to_sheet(exportRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Orders");
      XLSX.writeFile(wb, "orders.xlsx");
    } catch (e: any) {
      showToast({ type: "error", message: e?.message || "Excel eksportda xatolik." });
    }
  };

  const exportPdf = () => {
    if (!exportRows.length) return showToast({ type: "info", message: "Eksport uchun ma'lumot yo‘q." });

    const cols = Object.keys(exportRows[0] ?? {});
    if (!cols.length) return showToast({ type: "info", message: "Eksport uchun ustunlar topilmadi." });

    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Zakazlar</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            h1 { font-size: 16px; margin: 0 0 12px; }
            table { border-collapse: collapse; width: 100%; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; vertical-align: top; }
            th { background: #f5f5f5; }
            .muted { color: #666; font-size: 11px; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <h1>Zakazlar</h1>
          <div class="muted">Eksport qilingan sana: ${escapeHtml(new Date().toLocaleString())}</div>
          <table>
            <thead>
              <tr>${cols.map((k) => `<th>${escapeHtml(k)}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${exportRows
                .map((r) => `<tr>${cols.map((k) => `<td>${escapeHtml((r as any)[k])}</td>`).join("")}</tr>`)
                .join("")}
            </tbody>
          </table>
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `;

    const w = window.open("", "_blank", "width=980,height=720");
    if (!w) return showToast({ type: "error", message: "Popup bloklangan. Popuplarga ruxsat bering." });

    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  /* =========================
   * Derived stats (Bags)
   * ========================= */
  const bagsCount = bags.length;
  const handedBagsCount = useMemo(() => bags.filter((b) => b.status === "handover").length, [bags]);
  const totalOrdersInBags = useMemo(() => bags.reduce((a, b) => a + b.orderIds.length, 0), [bags]);

  return (
    <div className="space-y-4">
      <BulkBar couriers={couriers.map((c: any) => ({ id: c.id, name: c.name }))} onToast={showToast} />

      {/* Top header card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-3 md:p-4 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <Segmented
            value={tab}
            onChange={(v) => setTab(v as any)}
            items={[
              {
                key: "orders",
                label: (
                  <>
                    <ListChecks className="h-4 w-4" />
                    Zakazlar <span className="text-xs text-slate-500">({orders.length})</span>
                  </>
                ),
              },
              {
                key: "bags",
                label: (
                  <>
                    <Boxes className="h-4 w-4" />
                    Qoplar <span className="text-xs text-slate-500">({bags.length})</span>
                  </>
                ),
              },
            ]}
          />

          <div className="flex-1" />

          {/* right actions */}
          {tab === "orders" ? (
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <Button variant="outline" size="sm" onClick={() => setAssignOpen(true)}>
                Kuryerga topshirish
              </Button>

              <Button variant="outline" size="sm" onClick={() => setFiltersOpen(true)}>
                <span className="inline-flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filtrlar
                </span>
              </Button>

              <Button variant="outline" size="sm" onClick={exportXlsx}>
                <span className="inline-flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel
                </span>
              </Button>

              <Button variant="outline" size="sm" onClick={exportPdf}>
                <span className="inline-flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  PDF
                </span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <div className="hidden md:flex items-center gap-2">
                <StatPill icon={<Boxes className="h-4 w-4" />} label="Qoplar" value={bagsCount} tone="slate" />
                <StatPill icon={<Package className="h-4 w-4" />} label="Topshirildi" value={handedBagsCount} tone="emerald" />
                <StatPill
                  icon={<ListChecks className="h-4 w-4" />}
                  label="Qopdagi zakazlar"
                  value={totalOrdersInBags}
                  tone="sky"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border bg-white p-10 text-center text-slate-500">Yuklanmoqda...</div>
      ) : tab === "orders" ? (
        <>
          {/* MOBILE ACTION BAR */}
          <div className="lg:hidden">
            <div className="rounded-3xl border bg-white p-3 flex items-center gap-2">
              <button
                onClick={() => setFiltersOpen(true)}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border px-3 py-2 text-sm hover:bg-slate-50"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filtrlar
              </button>

              <button onClick={exportXlsx} className="rounded-2xl border px-3 py-2 hover:bg-slate-50" title="Excel">
                <FileSpreadsheet className="h-4 w-4" />
              </button>

              <button onClick={exportPdf} className="rounded-2xl border px-3 py-2 hover:bg-slate-50" title="PDF">
                <FileText className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* DESKTOP TABLE */}
          <div className="hidden lg:block">
            <OrdersTable
              orders={orders}
              couriers={couriers}
              onOpenDetails={openDetails}
              onOpenEdit={openEdit}
              onExportPdf={exportPdf}
              onExportXlsx={exportXlsx}
              onOpenFilters={() => setFiltersOpen(true)}
            />
          </div>

          {/* MOBILE CARDS */}
          <div className="lg:hidden">
            <OrdersCards orders={orders} couriers={couriers} onOpenDetails={openDetails} onOpenEdit={openEdit} />
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-3 md:p-4 shadow-sm">
            <Pagination
              page={page}
              pageSize={pageSize}
              total={data?.total || 0}
              onPage={setPage}
              onPageSize={(n) => {
                setPageSize(n);
                setPage(1);
              }}
            />
          </div>
        </>
      ) : (
        <BagsSection
          bags={bags}
          couriers={couriers}
          onOpenDetails={(bagId) => {
            setActiveBagId(bagId);
            setBagDetailsOpen(true);
          }}
        />
      )}

      {/* FILTERS */}
      <FiltersModal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        cities={cities}
        couriers={couriers.map((c: any) => ({ id: c.id, name: c.name }))}
      />

      {/* DETAILS */}
      <DetailsDrawer
        open={!!detailsId}
        order={detailsOrder}
        couriers={couriers}
        onClose={() => {
          setDetailsId(null);
          setDetailsOrder(null);
        }}
      />

      {/* EDIT */}
      <OrderFormModal
        open={!!editId}
        mode="edit"
        couriers={couriers}
        initial={editOrder}
        onClose={() => {
          setEditId(null);
          setEditOrder(null);
        }}
        onSubmit={submitEdit}
      />

      {/* TOAST */}
      <Toast
        open={toast.open}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast((s) => ({ ...s, open: false }))}
      />

      {/* ASSIGN MODAL */}
      <AssignToCourierModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        orders={orders}
        couriers={couriers}
        onCommit={async () => {
          try {
            showToast({ type: "success", message: "Topshirish yakunlandi." });
            setAssignOpen(false);
            await load();
          } catch {
            // no-op
          }
        }}
        onBagCreated={(payload: { courierId: string; orderIds: string[] }) => {
          setBags((prev) => {
            const bag: BagType = {
              id: uid(),
              bagNo: nextBagNo(prev.length + 1),
              courierId: payload.courierId,
              orderIds: payload.orderIds,
              createdAt: new Date().toISOString(),
              status: "handover",
            };
            return [bag, ...prev];
          });
          showToast({ type: "success", message: "Qop yaratildi va ro‘yxatga qo‘shildi." });
        }}
      />

      {/* ✅ BAG DETAILS MODAL (extracted) */}
      <BagDetailsModal
        open={bagDetailsOpen}
        bag={activeBag}
        onClose={() => setBagDetailsOpen(false)}
        ordersInPage={orders}
        getOrderById={(id) => repo.getOrder(id)}
        courierName={courierName}
        onToast={showToast}
      />
    </div>
  );
}

/* =========================
 * Export default
 * ========================= */
export default function OrdersClient() {
  return (
    <OrdersProvider>
      <Screen />
    </OrdersProvider>
  );
}
