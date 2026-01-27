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
  const ATTR = "data-pdf-root";
  node.setAttribute(ATTR, "1");

  try {
    if (document.fonts?.ready) {
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

        root.classList.add("pdf-safe-root");

        const style = clonedDoc.createElement("style");
        style.setAttribute("data-pdf-safe-style", "1");
        style.innerHTML = `
          .pdf-safe-root, .pdf-safe-root * {
            color: #0f172a !important;
            background-color: transparent !important;
            border-color: #e2e8f0 !important;
            text-decoration-color: #0f172a !important;
            filter: none !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            box-shadow: none !important;
          }
          .pdf-safe-root { background-color: #ffffff !important; }
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

    if (!canvas.width || !canvas.height) {
      throw new Error("PDF olishda xatolik: canvas bo‘sh qaytdi.");
    }

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;

    if (imgH <= pageH) {
      pdf.addImage(imgData, "PNG", 0, 0, imgW, imgH);
      pdf.save(fileName);
      return;
    }

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
        sliceCanvas.height
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

function cardClass() {
  return "rounded-2xl border border-slate-200 p-4 shadow-sm bg-white";
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
    []
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

    try {
      setPdfBusy(true);
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
            {/* TOP: 3 cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {/* Sender */}
              <div className={cardClass()}>
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
              <div className={cardClass()}>
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
              <div className={cardClass()}>
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
            </div>

            {/* BOTTOM: proofs as separate block (not inside 3-col grid) */}
            <div className="mt-3">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <ProofCard title="Yuboruvchidan qabul qilish (Pickup)" proof={order.pickupProof ?? undefined} />
                <ProofCard title="Qabul qiluvchiga topshirish (Delivery)" proof={order.deliveryProof ?? undefined} />
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
                                  <span
                                    className={[
                                      "inline-flex items-center rounded-full px-3 py-1 text-xs ring-1",
                                      STATUS_BADGE[ev.status],
                                    ].join(" ")}
                                  >
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

                              {ev.description ? <div className="mt-3 text-sm text-slate-700 leading-6">{ev.description}</div> : null}
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
              <div className={cardClass()}>
                <div className="text-xs text-slate-500 uppercase tracking-wide">To‘lov usuli</div>
                <div className="font-semibold mt-2 text-slate-900">{order.paymentMethod}</div>
              </div>

              <div className={`${cardClass()} lg:col-span-2`}>
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
                  * Ushbu chek elektron ko‘rinishda. Savollar bo‘lsa диспетчерга murojaat qiling.
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
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">O‘zgarishlar tarixi</div>
          <div className="text-xs text-slate-500">Kim, qachon, nimani o‘zgartirdi</div>
        </div>

        <div className="text-xs text-slate-500">
          Jami: <b className="text-slate-900">{order.history?.length ?? 0}</b>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-5">
        {order.history?.length ? (
          <HistoryTimeline items={order.history} />
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
        <div className="min-w-0">
          <div className="text-xs text-slate-500 uppercase tracking-wide">Tasdiq</div>
          <div className="text-sm font-semibold text-slate-900 mt-1">{title}</div>

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
        <div className="mt-3 text-sm text-slate-500">Hozircha imzo/rasm mavjud emas.</div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {/* Signature */}
          <MediaTile label="Imzo" kind="signature" src={proof?.signatureUrl} />

          {/* Parcel photo */}
          <MediaTile label="Posilka rasmi" kind="photo" src={proof?.parcelPhotoUrl} />
        </div>
      )}
    </div>
  );
}

function MediaTile({
  label,
  src,
  kind,
}: {
  label: string;
  src?: string;
  kind: "signature" | "photo";
}) {
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-3 py-2 bg-slate-50 border-b border-slate-200">
        <div className="text-[11px] font-medium text-slate-600">{label}</div>
      </div>

      <div className="h-40 bg-white flex items-center justify-center">
        {src ? (
          <img
            src={src}
            alt={label}
            className={[
              "h-full w-full",
              kind === "signature" ? "object-contain" : "object-cover",
            ].join(" ")}
            crossOrigin="anonymous"
          />
        ) : (
          <div className="text-sm text-slate-400">{kind === "signature" ? "Imzo yo‘q" : "Rasm yo‘q"}</div>
        )}
      </div>
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




function HistoryTimeline({ items }: { items: Array<any> }) {
  const sorted = items
    .slice()
    .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());

  return (
    <ol className="relative">
      {/* vertical line */}
      <div className="absolute left-[14px] top-0 bottom-0 w-px bg-gradient-to-b from-slate-200 via-slate-200 to-transparent" />

      <div className="space-y-3">
        {sorted.map((h, idx) => {
          const tone = actionTone(h.action);
          const isFirst = idx === 0;

          return (
            <li key={h.id} className="relative pl-10">
              {/* dot */}
              <div
                className={[
                  "absolute left-[8px] top-[18px] h-3.5 w-3.5 rounded-full ring-4 ring-white",
                  isFirst ? "bg-slate-900 shadow-sm" : "bg-slate-400",
                ].join(" ")}
              />

              <div
                className={[
                  "rounded-2xl border bg-white p-4 transition",
                  "hover:shadow-sm hover:-translate-y-[1px]",
                  tone.border,
                ].join(" ")}
              >
                {/* top row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="text-sm font-semibold text-slate-900 truncate">{h.actorName}</div>

                      <span className={["inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ring-1", tone.badge].join(" ")}>
                        {humanAction(h.action)}
                      </span>

                      {h.field ? (
                        <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600 ring-1 ring-slate-200">
                          Field: <b className="ml-1 text-slate-900">{h.field}</b>
                        </span>
                      ) : null}
                    </div>

                    {h.note ? (
                      <div className="mt-2 text-sm text-slate-700 leading-6">
                        {h.note}
                      </div>
                    ) : null}
                  </div>

                  <div className="shrink-0 text-xs text-slate-500 whitespace-nowrap">
                    {fmtDate(h.ts)}
                  </div>
                </div>

                {/* from -> to */}
                {(h.from !== undefined || h.to !== undefined) ? (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <KV title="From" value={String(h.from ?? "—")} muted />
                    <KV title="To" value={String(h.to ?? "—")} strong />
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </div>
    </ol>
  );
}

function KV({
  title,
  value,
  muted,
  strong,
}: {
  title: string;
  value: string;
  muted?: boolean;
  strong?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="text-[11px] text-slate-500">{title}</div>
      <div
        className={[
          "mt-0.5 text-sm",
          muted ? "text-slate-600" : "text-slate-700",
          strong ? "font-semibold text-slate-900" : "",
          "truncate",
        ].join(" ")}
        title={value}
      >
        {value}
      </div>
    </div>
  );
}

function actionTone(action: string) {
  // ranglarni minimal, zamonaviy (pastel) qilib berdim
  switch (action) {
    case "status_change":
      return {
        badge: "bg-indigo-50 text-indigo-700 ring-indigo-200",
        border: "border-indigo-100",
      };
    case "assign_courier":
      return {
        badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
        border: "border-emerald-100",
      };
    case "payment":
      return {
        badge: "bg-amber-50 text-amber-700 ring-amber-200",
        border: "border-amber-100",
      };
    case "update":
      return {
        badge: "bg-slate-50 text-slate-700 ring-slate-200",
        border: "border-slate-200",
      };
    case "create":
      return {
        badge: "bg-sky-50 text-sky-700 ring-sky-200",
        border: "border-sky-100",
      };
    default:
      return {
        badge: "bg-slate-50 text-slate-700 ring-slate-200",
        border: "border-slate-200",
      };
  }
}

