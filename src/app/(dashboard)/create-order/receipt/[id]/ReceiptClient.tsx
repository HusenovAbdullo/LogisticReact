"use client";

import React from "react";

function fmtDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function payTypeLabel(v?: string) {
  if (v === "cash") return "Naqd";
  if (v === "card") return "Karta";
  if (v === "transfer") return "O‘tkazma";
  return v || "";
}

export default function ReceiptClient({ order }: { order: any }) {
  const weightG = order?.shipment?.weightG ?? order?.weightG; // fallback
  const pieces = order?.shipment?.pieces ?? order?.pieces;
  const volumeM3 = order?.shipment?.volumeM3 ?? order?.volumeM3;

  return (
    <div className="min-h-screen bg-slate-50 p-6 print:bg-white print:p-0">
      {/* Toolbar (printda ko‘rinmaydi) */}
      <div className="mx-auto mb-4 flex max-w-[720px] items-center justify-between gap-2 print:hidden">
        <div className="text-sm text-slate-600">
          Chek / Receipt
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium hover:bg-slate-50"
          >
            Chop etish
          </button>
          <button
            onClick={() => window.close()}
            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium hover:bg-slate-50"
          >
            Yopish
          </button>
        </div>
      </div>

      {/* Receipt */}
      <div className="mx-auto max-w-[720px] rounded-2xl border border-slate-200 bg-white p-6 shadow-sm print:shadow-none">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold text-slate-900">NextLine — Chek</div>
            <div className="mt-1 text-sm text-slate-500">
              Yaratilgan: {fmtDate(order?.createdAt)}
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs uppercase tracking-wider text-slate-500">Zakaz</div>
            <div className="text-xl font-semibold text-slate-900">{order?.code || "—"}</div>
            <div className="mt-1 text-sm text-slate-600">Barcode: {order?.barcode || "—"}</div>
          </div>
        </div>

        <hr className="my-5 border-slate-200" />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Yuboruvchi
            </div>
            <div className="mt-2 text-sm text-slate-900 font-medium">{order?.sender?.name || order?.senderName || "—"}</div>
            <div className="mt-1 text-sm text-slate-600">{order?.sender?.phone || order?.senderPhone || "—"}</div>
            <div className="mt-1 text-sm text-slate-600">
              {(order?.sender?.city || order?.senderCity || "—")}, {(order?.sender?.address || order?.senderAddress || "")}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Qabul qiluvchi
            </div>
            <div className="mt-2 text-sm text-slate-900 font-medium">{order?.recipient?.name || order?.recipientName || "—"}</div>
            <div className="mt-1 text-sm text-slate-600">{order?.recipient?.phone || order?.recipientPhone || "—"}</div>
            <div className="mt-1 text-sm text-slate-600">
              {(order?.recipient?.city || order?.recipientCity || "—")}, {(order?.recipient?.address || order?.recipientAddress || "")}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Jo‘natma
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Info k="Og‘irlik (g)" v={weightG ?? "—"} />
            <Info k="Hajm (m³)" v={volumeM3 ?? "—"} />
            <Info k="Dona" v={pieces ?? "—"} />
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Info k="Xizmat" v={order?.shipment?.serviceType || order?.serviceType || "—"} />
            <Info k="Reja sana" v={order?.shipment?.planDate || order?.planDate || "—"} />
            <Info k="Vaqt" v={`${order?.shipment?.planFrom || order?.planFrom || "—"} - ${order?.shipment?.planTo || order?.planTo || "—"}`} />
          </div>

          {order?.shipment?.description || order?.description ? (
            <div className="mt-3 text-sm text-slate-700">
              <span className="text-slate-500">Izoh: </span>
              {order?.shipment?.description || order?.description}
            </div>
          ) : null}
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            To‘lov
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Info k="Turi" v={payTypeLabel(order?.payment?.payType || order?.payType)} />
            <Info k="Valyuta" v={order?.payment?.payCurrency || order?.payCurrency || "UZS"} />
            <Info k="Summa" v={order?.payment?.payAmount ?? order?.payAmount ?? "—"} />
          </div>

          {order?.payment?.payComment || order?.payComment ? (
            <div className="mt-3 text-sm text-slate-700">
              <span className="text-slate-500">Izoh: </span>
              {order?.payment?.payComment || order?.payComment}
            </div>
          ) : null}
        </div>

        <div className="mt-6 text-center text-xs text-slate-400">
          Ushbu чек mock rejimda. Real billing keyin ulanadi.
        </div>
      </div>
    </div>
  );
}

function Info({ k, v }: { k: string; v: any }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <div className="text-[11px] text-slate-500">{k}</div>
      <div className="text-sm font-semibold text-slate-900">{String(v)}</div>
    </div>
  );
}
