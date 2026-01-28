// app/(dashboard)/orders/ui/components/BagDetailsModal.tsx
"use client";

import React, { useMemo, useState } from "react";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import { Boxes, Package, ListChecks, FileText, Receipt } from "lucide-react";
import type { Bag } from "./BagsSection";

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

function num(n: unknown) {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}

/* =========================
 * UI atoms (local)
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

type Props = {
  open: boolean;
  bag: Bag | null;

  onClose: () => void;

  // qop ichidagi zakazlar: ekranda ko‘rsatish uchun (current page’dan)
  ordersInPage: any[];

  // eksport uchun to‘liq zakazlarni olish (bag.orderIds bo‘yicha)
  getOrderById: (id: string) => Promise<any>;

  // kuryer nomini chiqarish
  courierName: (id: string) => string;

  // toast uchun (ixtiyoriy)
  onToast?: (t: { type: any; message: string }) => void;
};

export default function BagDetailsModal({
  open,
  bag,
  onClose,
  ordersInPage,
  getOrderById,
  courierName,
  onToast,
}: Props) {
  const [exporting, setExporting] = useState<null | "pdf" | "check">(null);

  // UI: current page ichidan ko‘rinadigan zakazlar
  const visibleOrders = useMemo(() => {
    if (!bag) return [];
    const s = new Set(bag.orderIds ?? []);
    return (ordersInPage ?? []).filter((o: any) => s.has(o.id));
  }, [bag, ordersInPage]);

  const fetchBagOrdersFull = async (b: Bag) => {
    const ids = b?.orderIds ?? [];
    if (!ids.length) return [];

    const res = await Promise.allSettled(ids.map((id) => getOrderById(id)));
    return res
      .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled")
      .map((r) => r.value);
  };

  const exportBagPdf = async () => {
    if (!bag) return;

    setExporting("pdf");
    try {
      const fullOrders = await fetchBagOrdersFull(bag);
      if (!fullOrders.length) {
        onToast?.({ type: "info", message: "Qop ichida zakazlar yo‘q." });
        return;
      }

      const cols = ["Kod", "Barcode", "Yo‘nalish", "Dona", "Og‘irlik"];
      const rows = fullOrders.map((o: any) => ({
        Kod: o.code ?? "",
        Barcode: o.barcode ?? "",
        "Yo‘nalish": `${o.sender?.city || "—"} → ${o.recipient?.city || "—"}`,
        Dona: o.pieces ?? "—",
        "Og‘irlik": o.weightKg ? `${o.weightKg} kg` : "—",
      }));

      const html = `
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Qop: ${escapeHtml(bag.bagNo)}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 24px; }
              h1 { font-size: 16px; margin: 0 0 8px; }
              .meta { font-size: 12px; color: #444; margin-bottom: 12px; line-height: 18px; }
              table { border-collapse: collapse; width: 100%; font-size: 12px; }
              th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; vertical-align: top; }
              th { background: #f5f5f5; }
              .barcode { font-family: monospace; font-size: 12px; }
            </style>
          </head>
          <body>
            <h1>Qop: ${escapeHtml(bag.bagNo)}</h1>
            <div class="meta">
              Kuryer: <b>${escapeHtml(courierName(bag.courierId))}</b><br/>
              Yaratilgan: ${escapeHtml(new Date(bag.createdAt).toLocaleString())}<br/>
              Zakazlar soni: ${escapeHtml(String(bag.orderIds.length))}
            </div>

            <table>
              <thead>
                <tr>${cols.map((k) => `<th>${escapeHtml(k)}</th>`).join("")}</tr>
              </thead>
              <tbody>
                ${rows
                  .map(
                    (r) => `
                    <tr>
                      <td>${escapeHtml(r.Kod)}</td>
                      <td class="barcode">${escapeHtml(r.Barcode)}</td>
                      <td>${escapeHtml(r["Yo‘nalish"])}</td>
                      <td>${escapeHtml(String(r.Dona))}</td>
                      <td>${escapeHtml(String(r["Og‘irlik"]))}</td>
                    </tr>
                  `,
                  )
                  .join("")}
              </tbody>
            </table>

            <script>window.onload = () => window.print();</script>
          </body>
        </html>
      `;

      const w = window.open("", "_blank", "width=980,height=720");
      if (!w) {
        onToast?.({ type: "error", message: "Popup bloklangan. Popuplarga ruxsat bering." });
        return;
      }
      w.document.open();
      w.document.write(html);
      w.document.close();
    } catch (e: any) {
      onToast?.({ type: "error", message: e?.message || "Qop PDF eksportda xatolik." });
    } finally {
      setExporting(null);
    }
  };

  const exportBagCheck = async () => {
    if (!bag) return;

    setExporting("check");
    try {
      const fullOrders = await fetchBagOrdersFull(bag);
      if (!fullOrders.length) {
        onToast?.({ type: "info", message: "Qop ichida zakazlar yo‘q." });
        return;
      }

      const totalPieces = fullOrders.reduce((a: number, o: any) => a + num(o.pieces), 0);
      const totalWeight = fullOrders.reduce((a: number, o: any) => a + num(o.weightKg), 0);

      const html = `
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Chek: ${escapeHtml(bag.bagNo)}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 24px; max-width: 520px; }
              h1 { font-size: 16px; margin: 0 0 10px; }
              .line { display:flex; justify-content:space-between; font-size: 12px; margin: 6px 0; }
              .muted { color:#666; }
              hr { border:0; border-top:1px dashed #ccc; margin: 12px 0; }
              table { width:100%; border-collapse: collapse; font-size: 12px; }
              td { padding: 6px 0; border-bottom: 1px dotted #ddd; }
              .right { text-align:right; }
              .bold { font-weight: 700; }
            </style>
          </head>
          <body>
            <h1>Chek</h1>

            <div class="line"><span class="muted">Qop</span><span class="bold">${escapeHtml(bag.bagNo)}</span></div>
            <div class="line"><span class="muted">Kuryer</span><span>${escapeHtml(courierName(bag.courierId))}</span></div>
            <div class="line"><span class="muted">Sana</span><span>${escapeHtml(new Date().toLocaleString())}</span></div>

            <hr/>

            <div class="line"><span>Zakazlar soni</span><span class="bold">${escapeHtml(String(fullOrders.length))}</span></div>
            <div class="line"><span>Jami dona</span><span class="bold">${escapeHtml(String(totalPieces))}</span></div>
            <div class="line"><span>Jami og‘irlik</span><span class="bold">${escapeHtml(totalWeight.toFixed(2))} kg</span></div>

            <hr/>

            <table>
              ${fullOrders
                .map(
                  (o: any) => `
                  <tr>
                    <td>${escapeHtml(o.code ?? "—")}</td>
                    <td class="right">${escapeHtml(String(o.pieces ?? "—"))} dona</td>
                  </tr>
                `,
                )
                .join("")}
            </table>

            <script>window.onload = () => window.print();</script>
          </body>
        </html>
      `;

      const w = window.open("", "_blank", "width=680,height=720");
      if (!w) {
        onToast?.({ type: "error", message: "Popup bloklangan. Popuplarga ruxsat bering." });
        return;
      }
      w.document.open();
      w.document.write(html);
      w.document.close();
    } catch (e: any) {
      onToast?.({ type: "error", message: e?.message || "Chek chiqarishda xatolik." });
    } finally {
      setExporting(null);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={bag ? `Qop: ${bag.bagNo}` : "Qop"}
      widthClass="max-w-5xl"
    >
      {!bag ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Qop topilmadi.
        </div>
      ) : (
        <div className="space-y-4">
          {/* meta */}
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <StatPill icon={<Boxes className="h-4 w-4" />} label="Qop raqami" value={bag.bagNo} tone="slate" />
              <StatPill
                icon={<Package className="h-4 w-4" />}
                label="Kuryer"
                value={courierName(bag.courierId)}
                tone="emerald"
              />
              <StatPill
                icon={<ListChecks className="h-4 w-4" />}
                label="Zakazlar soni"
                value={`${bag.orderIds.length} ta`}
                tone="sky"
              />
            </div>
            <div className="mt-3 text-xs text-slate-500">
              Yaratilgan: <span className="text-slate-700">{new Date(bag.createdAt).toLocaleString()}</span>
            </div>
          </div>

          {/* screenshot-style actions block */}
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-sm text-slate-700">
              Statuslar <b>kuryerga berildi</b> holatiga o‘tkazildi.
            </div>

            <div className="mt-3 flex items-center gap-3 flex-wrap">
              <Button onClick={exportBagPdf} disabled={exporting !== null}>
                <span className="inline-flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  PDF
                </span>
              </Button>

              <Button variant="outline" onClick={exportBagCheck} disabled={exporting !== null}>
                <span className="inline-flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Chek
                </span>
              </Button>

              <div className="w-full text-xs text-slate-500">
                PDF ichida zakazlar ro‘yxati chiqadi (paginatsiyadan qat’i nazar qopdagi hamma zakazlar olinadi).
              </div>
            </div>
          </div>

          {/* orders in bag */}
          <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200">
              <div className="text-sm font-semibold text-slate-900">Qop ichidagi zakazlar</div>
              <div className="text-xs text-slate-500">Kod, barcode, yo‘nalish, dona va og‘irlik</div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[980px] w-full text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-slate-600">
                    <th className="p-3 text-left">Kod</th>
                    <th className="p-3 text-left">Barcode</th>
                    <th className="p-3 text-left">Yo‘nalish</th>
                    <th className="p-3 text-left">Dona</th>
                    <th className="p-3 text-left">Og‘irlik</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleOrders.map((o: any) => (
                    <tr key={o.id} className="border-t border-slate-200">
                      <td className="p-3 font-semibold text-slate-900">{o.code}</td>
                      <td className="p-3 text-slate-700">{o.barcode}</td>
                      <td className="p-3 text-slate-700">
                        {o.sender?.city} → {o.recipient?.city}
                      </td>
                      <td className="p-3 text-slate-700">{o.pieces ?? "—"}</td>
                      <td className="p-3 text-slate-700">{o.weightKg ? `${o.weightKg} kg` : "—"}</td>
                    </tr>
                  ))}

                  {!visibleOrders.length && (
                    <tr>
                      <td className="p-8 text-center text-slate-500" colSpan={5}>
                        Qop ichidagi zakazlar bu sahifada ko‘rinmayapti (paginatsiya sabab).
                        <br />
                        Eksport (PDF/Chek) esa baribir qopdagi hamma zakazlarni oladi.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Yopish
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
