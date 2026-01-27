// OrdersClient.tsx (yoki Screen bo‘lgan fayl)
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
import FiltersModal from "./components/FiltersModal"; // <-- MANA SHUNI import qiling
import { SlidersHorizontal, FileSpreadsheet, FileText } from "lucide-react";

/* =========================
 * PDF helpers
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

  const [toast, setToast] = useState<{ open: boolean; type: any; message: string }>({
    open: false,
    type: "info",
    message: "",
  });
  const showToast = (t: { type: any; message: string }) => setToast({ open: true, ...t });

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
        new Set(list.items.flatMap((o: any) => [o.sender?.city, o.recipient?.city]).filter(Boolean)),
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

  const orders = data?.items ?? [];

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

  return (
    <div className="space-y-4">
      <BulkBar couriers={couriers.map((c: any) => ({ id: c.id, name: c.name }))} onToast={showToast} />

      {loading ? (
        <div className="rounded-2xl border bg-white p-10 text-center text-slate-500">Yuklanmoqda...</div>
      ) : (
        <>
          {/* MOBILE ACTION BAR */}
          <div className="lg:hidden">
            <div className="rounded-2xl border bg-white p-3 flex items-center gap-2">
              <button
                onClick={() => setFiltersOpen(true)}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm hover:bg-slate-50"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filtrlar
              </button>

              <button onClick={exportXlsx} className="rounded-xl border px-3 py-2 hover:bg-slate-50" title="Excel">
                <FileSpreadsheet className="h-4 w-4" />
              </button>

              <button onClick={exportPdf} className="rounded-xl border px-3 py-2 hover:bg-slate-50" title="PDF">
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

          <div className="rounded-2xl border bg-white p-3 md:p-4">
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
      )}

      {/* ✅ FILTER MODAL — endi to‘g‘ri */}
      <FiltersModal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        cities={cities}
        couriers={couriers.map((c: any) => ({ id: c.id, name: c.name }))}
      />

      <DetailsDrawer
        open={!!detailsId}
        order={detailsOrder}
        couriers={couriers}
        onClose={() => {
          setDetailsId(null);
          setDetailsOrder(null);
        }}
      />

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

      <Toast open={toast.open} type={toast.type} message={toast.message} onClose={() => setToast((s) => ({ ...s, open: false }))} />
    </div>
  );
}

export default function OrdersClient() {
  return (
    <OrdersProvider>
      <Screen />
    </OrdersProvider>
  );
}
