"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Courier, Order } from "../../model/types";
import { STATUS_BADGE, STATUS_LABEL, SLA_BADGE } from "../../model/constants";
import { fmtDate, money } from "../../lib/format";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import dynamic from "next/dynamic";

const RouteMap = dynamic(() => import("./RouteMap"), { ssr: false });

type Tab = "info" | "timeline" | "payment" | "map" | "history";

/* =========================
 * Utils
 * ========================= */
function safeFileName(s: string) {
  return (s || "file")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function nextPaint() {
  await new Promise<void>((r) => requestAnimationFrame(() => r()));
  await new Promise<void>((r) => requestAnimationFrame(() => r()));
}

async function exportNodeToPdf(node: HTMLElement, fileName: string) {
  // html2canvas "lab()" muammosini chetlash uchun:
  // clone qilingan DOM ichida PDF root’ga safe CSS injekt qilamiz.
  const ATTR = "data-pdf-root";
  node.setAttribute(ATTR, "1");

  try {
    // fontlar yuklansin (ba’zi holatda matn yo‘q bo‘lib qoladi)
    // @ts-expect-error - fonts ba’zi brauzerlarda yo‘q bo‘lishi mumkin
    if (document.fonts?.ready) {
      // @ts-expect-error
      await document.fonts.ready;
    }

    await nextPaint();

    const canvas = await html2canvas(node, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      allowTaint: false,
      logging: false,

      onclone: (clonedDoc) => {
        const root = clonedDoc.querySelector<HTMLElement>(`[${ATTR}="1"]`);
        if (!root) return;

        // PDF uchun safe-class
        root.classList.add("pdf-safe-root");

        // html2canvas ko‘p narsada yiqiladigan CSS’larni o‘chirib, safe rang beramiz
        const style = clonedDoc.createElement("style");
        style.setAttribute("data-pdf-safe-style", "1");
        style.innerHTML = `
          /* PDF SAFE MODE */
          .pdf-safe-root, .pdf-safe-root * {
            color: #0f172a !important;
            background-color: transparent !important;
            border-color: #e2e8f0 !important;
            text-decoration-color: #0f172a !important;

            /* html2canvas ko‘p yiqiladiganlar */
            filter: none !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;

            /* agar tailwind v4 lab/oklch ishlatsa ham biz hex bilan bostiramiz */
            box-shadow: none !important;
          }
          .pdf-safe-root {
            background-color: #ffffff !important;
          }
          .pdf-safe-root .shadow, 
          .pdf-safe-root .shadow-sm, 
          .pdf-safe-root .shadow-md,
          .pdf-safe-root .shadow-lg {
            box-shadow: none !important;
          }
        `;
        clonedDoc.head.appendChild(style);
      },
    });

    // canvas bo‘sh chiqmasin
    if (!canvas.width || !canvas.height) {
      throw new Error("PDF olishda xatolik: canvas bo‘sh qaytdi.");
    }

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;

    // 1 sahifa
    if (imgH <= pageH) {
      pdf.addImage(imgData, "PNG", 0, 0, imgW, imgH);
      pdf.save(fileName);
      return;
    }

    // ko‘p sahifa (slice)
    const pageHeightPx = Math.floor((canvas.width * pageH) / pageW);
    let renderedHeight = 0;

    while (renderedHeight < canvas.height) {
      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = Math.min(pageHeightPx, canvas.height - renderedHeight);

      const ctx = sliceCanvas.getContext("2d");
      if (!ctx) break;

      ctx.drawImage(
        canvas,
        0,
        renderedHeight,
        canvas.width,
        sliceCanvas.height,
        0,
        0,
        canvas.width,
        sliceCanvas.height,
      );

      const sliceData = sliceCanvas.toDataURL("image/png");
      const sliceHmm = (sliceCanvas.height * pageW) / sliceCanvas.width;

      if (renderedHeight > 0) pdf.addPage();
      pdf.addImage(sliceData, "PNG", 0, 0, pageW, sliceHmm);

      renderedHeight += sliceCanvas.height;
    }

    pdf.save(fileName);
  } finally {
    node.removeAttribute(ATTR);
  }
}

function pillClass(active: boolean) {
  return active
    ? "bg-white shadow-sm ring-1 ring-slate-200 font-semibold text-slate-900"
    : "text-slate-600 hover:text-slate-900";
}

/* =========================
 * Component
 * ========================= */
export default function DetailsDrawer({
  open,
  order,
  couriers,
  onClose,
}: {
  open: boolean;
  order: Order | null;
  couriers: Courier[];
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>("info");
  const [pdfBusy, setPdfBusy] = useState(false);

  const infoRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const paymentRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const historyRef = useRef<HTMLDivElement | null>(null);
  const receiptRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) setTab("info");
  }, [open]);

  const hasOrder = Boolean(order);

  const courier = useMemo(() => {
    if (!order) return null;
    return couriers.find((c) => c.id === order.courierId) || null;
  }, [couriers, order]);

  const tabs = useMemo(
    () => [
      { key: "info" as const, label: "Ma’lumot" },
      { key: "timeline" as const, label: "Timeline" },
      { key: "payment" as const, label: "To‘lov" },
      { key: "map" as const, label: "Xarita" },
      { key: "history" as const, label: "Tarix" },
    ],
    [],
  );

  function currentSectionRef() {
    if (tab === "info") return infoRef.current;
    if (tab === "timeline") return timelineRef.current;
    if (tab === "payment") return paymentRef.current;
    if (tab === "map") return mapRef.current;
    return historyRef.current;
  }

  async function onDownloadSectionPdf() {
    if (!order) return;

    // Xarita bo‘limida tile’lar CORS beradi — PDF blank bo‘lib qoladi.
    if (tab === "map") {
      alert("Xarita bo‘limini PDF qilish o‘chirilgan (OpenStreetMap tile CORS).");
      return;
    }

    const node = currentSectionRef();
    if (!node) return;

    try {
      setPdfBusy(true);
      await nextPaint();
      await exportNodeToPdf(node, `${safeFileName(order.code)}-${tab}.pdf`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "PDF olishda xatolik.";
      alert(msg);
    } finally {
      setPdfBusy(false);
    }
  }

  async function onDownloadReceiptPdf() {
    if (!order) return;

    // payment tab’da receiptRef render bo‘lishi uchun biroz kutamiz
    try {
      setPdfBusy(true);

      // agar user tez bossachi — DOM to‘liq chizilmagan bo‘ladi
      await nextPaint();
      await sleep(50);

      const node = receiptRef.current;
      if (!node) {
        alert("Chek blok topilmadi (receiptRef null).");
        return;
      }

      await exportNodeToPdf(node, `${safeFileName(order.code)}-chek.pdf`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Chek PDF olishda xatolik.";
      alert(msg);
    } finally {
      setPdfBusy(false);
    }
  }

  const headerChips = (
    <div className="flex items-center gap-2 flex-wrap">
      <span
        className={`inline-flex items-center rounded-full px-3 py-1 text-xs ring-1 ${
          order ? STATUS_BADGE[order.status] : "bg-slate-100 text-slate-600"
        }`}
      >
        {order ? STATUS_LABEL[order.status] : "—"}
      </span>

      <span
        className={`inline-flex items-center rounded-full px-3 py-1 text-xs ring-1 ${
          order ? SLA_BADGE[order.slaRisk] : "bg-slate-100 text-slate-600"
        }`}
      >
        SLA: {order ? order.slaRisk : "—"}
      </span>

      <div className="ml-auto text-xs text-slate-500">
        Yaratilgan: {order ? fmtDate(order.createdAt) : "—"}
      </div>
    </div>
  );

  return (
    <Modal open={open} title={`Zakaz: ${order?.code ?? "—"}`} onClose={onClose} widthClass="max-w-6xl">
      {/* Header */}
      <div className="rounded-2xl bg-white">
        {headerChips}

        {/* Action row */}
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <div className="inline-flex rounded-xl bg-slate-100 p-1 ring-1 ring-slate-200/70">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-3 py-2 rounded-lg text-sm transition ${pillClass(tab === t.key)}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="ml-auto flex gap-2">
            <Button onClick={onDownloadSectionPdf} variant="outline" disabled={!hasOrder || pdfBusy}>
              Bo‘lim PDF
            </Button>

            {tab === "payment" ? (
              <Button onClick={onDownloadReceiptPdf} variant="primary" disabled={!hasOrder || pdfBusy}>
                Chek PDF
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="mt-4">
        {!order ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="text-sm text-slate-500">Ma’lumot yuklanmoqda...</div>
          </div>
        ) : tab === "info" ? (
          <div ref={infoRef} className="rounded-2xl bg-white">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {/* Sender */}
              <div className="rounded-2xl border border-slate-200 p-4 shadow-sm">
                <div className="text-xs text-slate-500 uppercase tracking-wide">Yuboruvchi</div>
                <div className="font-semibold mt-1 text-slate-900">{order.sender.name}</div>
                <div className="text-sm text-slate-600 mt-1">{order.sender.phone}</div>
                <div className="text-sm text-slate-600 mt-1">
                  {order.sender.city}, {order.sender.country}
                </div>
                <div className="text-sm text-slate-600 mt-1">{order.sender.address}</div>
                <div className="text-xs text-slate-500 mt-2">
                  Geo: {order.sender.geo.lat.toFixed(4)}, {order.sender.geo.lng.toFixed(4)}
                </div>
              </div>

              {/* Recipient */}
              <div className="rounded-2xl border border-slate-200 p-4 shadow-sm">
                <div className="text-xs text-slate-500 uppercase tracking-wide">Qabul qiluvchi</div>
                <div className="font-semibold mt-1 text-slate-900">{order.recipient.name}</div>
                <div className="text-sm text-slate-600 mt-1">{order.recipient.phone}</div>
                <div className="text-sm text-slate-600 mt-1">
                  {order.recipient.city}, {order.recipient.country}
                </div>
                <div className="text-sm text-slate-600 mt-1">{order.recipient.address}</div>
                <div className="text-xs text-slate-500 mt-2">
                  Geo: {order.recipient.geo.lat.toFixed(4)}, {order.recipient.geo.lng.toFixed(4)}
                </div>
              </div>

              {/* Shipment */}
              <div className="rounded-2xl border border-slate-200 p-4 shadow-sm">
                <div className="text-xs text-slate-500 uppercase tracking-wide">Shipment</div>

                <div className="mt-3 space-y-2 text-sm">
                  <Row label="Kod" value={<b>{order.code}</b>} />
                  <Row label="Barcode" value={<b>{order.barcode}</b>} />
                  <Row
                    label="Reja"
                    value={
                      <b>
                        {fmtDate(order.scheduledDate)} {order.timeFrom}-{order.timeTo}
                      </b>
                    }
                  />
                  <Row label="Og‘irlik" value={<b>{order.weightKg} kg</b>} />
                  <Row label="Hajm" value={<b>{order.volumeM3} m³</b>} />
                  <Row label="Dona" value={<b>{order.pieces}</b>} />
                </div>

                <div className="mt-3 text-xs text-slate-500">
                  Taglar: {order.tags.length ? order.tags.join(", ") : "—"}
                </div>

                <div className="mt-2 text-xs text-slate-500">
                  Kuryer: {courier ? `${courier.name} (${courier.phone})` : "—"}
                </div>
              </div>
              <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
  <ProofCard title="Yuboruvchidan qabul qilish (Pickup)" proof={order.pickupProof} />
  <ProofCard title="Qabul qiluvchiga topshirish (Delivery)" proof={order.deliveryProof} />
</div>

            </div>
          </div>
        ) : tab === "timeline" ? (
          <div ref={timelineRef} className="rounded-2xl bg-white">
            {!order.events.length ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="text-sm text-slate-500">Timeline yo‘q.</div>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-200">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Timeline</div>
                    <div className="text-xs text-slate-500">Harakatlar ketma-ketligi (oxirgisi yuqorida)</div>
                  </div>
                  <div className="text-xs text-slate-500">
                    Jami: <b className="text-slate-900">{order.events.length}</b>
                  </div>
                </div>

                <ol className="relative px-5 py-5">
                  <div className="absolute left-[34px] top-0 bottom-0 w-px bg-gradient-to-b from-slate-200 via-slate-200 to-transparent" />

                  {order.events
                    .slice()
                    .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
                    .map((ev, idx) => {
                      const isFirst = idx === 0;

                      return (
                        <li key={ev.id} className="relative pl-12 pb-4 last:pb-0">
                          <div
                            className={[
                              "absolute left-[26px] top-[18px] h-4 w-4 rounded-full ring-4 ring-white",
                              isFirst ? "bg-gradient-to-br from-slate-900 to-slate-500 shadow-sm" : "bg-slate-900/70",
                            ].join(" ")}
                          />

                          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-slate-100">
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-slate-900 leading-5 truncate">{ev.title}</div>
                                {ev.description ? (
                                  <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{ev.description}</div>
                                ) : null}
                              </div>

                              <div className="shrink-0">
                                <span className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200">
                                  {fmtDate(ev.ts)}
                                </span>
                              </div>
                            </div>

                            <div className="px-4 py-3">
                              <div className="flex items-center gap-2 flex-wrap">
                                {ev.status ? (
                                  <span className={["inline-flex items-center rounded-full px-3 py-1 text-xs ring-1", STATUS_BADGE[ev.status]].join(" ")}>
                                    {STATUS_LABEL[ev.status]}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1 text-xs text-slate-600 ring-1 ring-slate-200">
                                    Status: —
                                  </span>
                                )}

                                {isFirst ? (
                                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700 ring-1 ring-emerald-200">
                                    Hozirgi
                                  </span>
                                ) : null}
                              </div>

                              {(ev.senderEmployee || ev.receiverEmployee) ? (
                                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {ev.senderEmployee ? (
                                    <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
                                      <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                                        Y
                                      </div>
                                      <div className="min-w-0">
                                        <div className="text-xs text-slate-500">Yubordi</div>
                                        <div className="text-sm font-semibold text-slate-900 truncate">{ev.senderEmployee.name}</div>
                                        {ev.senderEmployee.role ? <div className="text-[11px] text-slate-500">{ev.senderEmployee.role}</div> : null}
                                      </div>
                                    </div>
                                  ) : null}

                                  {ev.receiverEmployee ? (
                                    <div className="flex items-center gap-3 rounded-xl bg-emerald-50 px-3 py-2 ring-1 ring-emerald-200">
                                      <div className="h-8 w-8 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center text-xs font-bold">
                                        Q
                                      </div>
                                      <div className="min-w-0">
                                        <div className="text-xs text-slate-500">Qabul qildi</div>
                                        <div className="text-sm font-semibold text-slate-900 truncate">{ev.receiverEmployee.name}</div>
                                        {ev.receiverEmployee.role ? <div className="text-[11px] text-slate-500">{ev.receiverEmployee.role}</div> : null}
                                      </div>
                                    </div>
                                  ) : null}
                                </div>
                              ) : null}

                              {ev.description ? (
                                <div className="mt-3 text-sm text-slate-700 leading-6">{ev.description}</div>
                              ) : null}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                </ol>
              </div>
            )}
          </div>
        ) : tab === "payment" ? (
          <div ref={paymentRef} className="rounded-2xl bg-white">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-slate-200 p-4 shadow-sm">
                <div className="text-xs text-slate-500 uppercase tracking-wide">To‘lov usuli</div>
                <div className="font-semibold mt-2 text-slate-900">{order.paymentMethod}</div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4 shadow-sm lg:col-span-2">
                <div className="text-xs text-slate-500 uppercase tracking-wide">Summalar</div>
                <div className="mt-3 space-y-2 text-sm">
                  <Row label="Mahsulot" value={<b>{money(order.productValue.amount, order.productValue.currency)}</b>} />
                  <Row label="Yetkazib berish" value={<b>{money(order.deliveryFee.amount, order.deliveryFee.currency)}</b>} />
                  <div className="border-t border-slate-200 pt-3 mt-3 flex items-center justify-between">
                    <div className="font-semibold text-slate-900">Jami</div>
                    <div className="text-lg font-extrabold text-slate-900">
                      {money(order.total.amount, order.total.currency)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Receipt preview */}
            <div className="mt-4">
              <div className="text-sm font-semibold text-slate-900 mb-2">To‘lov cheki</div>

              <div ref={receiptRef} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm max-w-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs text-slate-500">NextLine</div>
                    <div className="text-lg font-extrabold text-slate-900">CHEK</div>
                    <div className="text-xs text-slate-500 mt-1">
                      Zakaz: <b>{order.code}</b>
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-500">{fmtDate(new Date().toISOString())}</div>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <Row label="To‘lov usuli" value={<b>{order.paymentMethod}</b>} />
                  <Row label="Mahsulot" value={<b>{money(order.productValue.amount, order.productValue.currency)}</b>} />
                  <Row label="Yetkazib berish" value={<b>{money(order.deliveryFee.amount, order.deliveryFee.currency)}</b>} />
                </div>

                <div className="border-t border-dashed border-slate-200 mt-4 pt-4 flex items-center justify-between">
                  <div className="font-semibold">Jami</div>
                  <div className="text-xl font-extrabold">{money(order.total.amount, order.total.currency)}</div>
                </div>

                <div className="mt-4 text-[11px] text-slate-500">
                  * Ushbu чек elektron ko‘rinishda. Savollar bo‘lsa диспетчерга murojaat qiling.
                </div>
              </div>
            </div>
          </div>
        ) : tab === "map" ? (
          <div ref={mapRef} className="rounded-2xl bg-white">
            <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-4 flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Marshrut (OpenStreetMap)</div>
                  <div className="text-xs text-slate-500">Yuboruvchi → Qabul qiluvchi</div>
                </div>

                <div className="text-xs text-slate-500">
                  {order.route?.distanceKm ? (
                    <>
                      Masofa: <b>{order.route.distanceKm}</b> km
                    </>
                  ) : (
                    "Masofa: —"
                  )}
                  {"  •  "}
                  {order.route?.etaMin ? (
                    <>
                      ETA: <b>{order.route.etaMin}</b> min
                    </>
                  ) : (
                    "ETA: —"
                  )}
                </div>
              </div>

              <div className="h-[420px]">
                <RouteMap
                  from={[order.sender.geo.lat, order.sender.geo.lng]}
                  to={[order.recipient.geo.lat, order.recipient.geo.lng]}
                  polyline={order.route?.polyline}
                />
              </div>
            </div>
          </div>
        ) : (
          <div ref={historyRef} className="rounded-2xl bg-white">
            <div className="rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold text-slate-900">O‘zgarishlar tarixi</div>
                  <div className="text-xs text-slate-500">Kim, qachon, nimani o‘zgartirdi</div>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {order.history?.length ? (
                  order.history
                    .slice()
                    .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
                    .map((h) => (
                      <div key={h.id} className="rounded-2xl border border-slate-200 p-4 bg-white">
                        <div className="flex items-start justify-between gap-3">
                          <div className="text-sm font-semibold text-slate-900">{h.actorName}</div>
                          <div className="text-xs text-slate-500">{fmtDate(h.ts)}</div>
                        </div>

                        <div className="mt-2 text-sm text-slate-700">
                          <span className="font-semibold">{humanAction(h.action)}</span>
                          {h.field ? (
                            <>
                              {" "}
                              • Field: <b>{h.field}</b>
                            </>
                          ) : null}
                        </div>

                        {h.from !== undefined || h.to !== undefined ? (
                          <div className="mt-2 text-sm text-slate-600">
                            <div className="flex gap-2">
                              <div className="w-16 text-xs text-slate-500">From</div>
                              <div className="flex-1">{String(h.from ?? "—")}</div>
                            </div>
                            <div className="flex gap-2 mt-1">
                              <div className="w-16 text-xs text-slate-500">To</div>
                              <div className="flex-1 font-semibold text-slate-900">{String(h.to ?? "—")}</div>
                            </div>
                          </div>
                        ) : null}

                        {h.note ? <div className="mt-2 text-sm text-slate-600">{h.note}</div> : null}
                      </div>
                    ))
                ) : (
                  <div className="text-sm text-slate-500">Tarix ma’lumotlari yo‘q.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

/* =========================
 * Helpers
 * ========================= */
function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-slate-600">{label}</div>
      <div className="text-slate-900 text-right">{value}</div>
    </div>
  );
}

function ProofCard({
  title,
  proof,
}: {
  title: string;
  proof?: {
    signatureUrl?: string;
    parcelPhotoUrl?: string;
    signedAt?: string;
    signedByName?: string;
  };
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4 shadow-sm bg-white">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wide">
            Tasdiq
          </div>
          <div className="text-sm font-semibold text-slate-900 mt-1">
            {title}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {proof?.signedAt ? (
              <>
                Vaqt: <b className="text-slate-700">{fmtDate(proof.signedAt)}</b>
              </>
            ) : (
              "Vaqt: —"
            )}
            {proof?.signedByName ? (
              <>
                {"  "}•{"  "}Kim: <b className="text-slate-700">{proof.signedByName}</b>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {!proof?.signatureUrl && !proof?.parcelPhotoUrl ? (
        <div className="mt-3 text-sm text-slate-500">
          Hozircha imzo/rasm mavjud emas.
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Signature */}
          <div className="rounded-xl border border-slate-200 p-3">
            <div className="text-xs text-slate-500 mb-2">Imzo</div>
            {proof?.signatureUrl ? (
              <img
                src={proof.signatureUrl}
                alt="signature"
                className="h-28 w-full object-contain bg-white"
                crossOrigin="anonymous"
              />
            ) : (
              <div className="h-28 rounded-lg bg-slate-50 flex items-center justify-center text-sm text-slate-400">
                Imzo yo‘q
              </div>
            )}
          </div>

          {/* Parcel photo */}
          <div className="rounded-xl border border-slate-200 p-3">
            <div className="text-xs text-slate-500 mb-2">Posilka rasmi</div>
            {proof?.parcelPhotoUrl ? (
              <img
                src={proof.parcelPhotoUrl}
                alt="parcel"
                className="h-28 w-full object-cover rounded-lg"
                crossOrigin="anonymous"
              />
            ) : (
              <div className="h-28 rounded-lg bg-slate-50 flex items-center justify-center text-sm text-slate-400">
                Rasm yo‘q
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


function humanAction(a: string) {
  switch (a) {
    case "create":
      return "Zakaz yaratildi";
    case "update":
      return "Ma’lumot yangilandi";
    case "status_change":
      return "Status o‘zgardi";
    case "assign_courier":
      return "Kuryer biriktirildi";
    case "payment":
      return "To‘lov qayd etildi";
    default:
      return a;
  }
}
