"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Courier, Order } from "../../model/types";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import { fmtDate } from "../../lib/format";
import jsPDF from "jspdf";
import JsBarcode from "jsbarcode";

type Props = {
  open: boolean;
  onClose: () => void;
  orders: Order[];
  couriers: Courier[];
  onCommit: (orderIds: string[]) => void;
  onBagCreated?: (payload: { courierId: string; orderIds: string[] }) => void;
};

type Flash = { type: "ok" | "err"; text: string } | null;

export default function AssignToCourierModal({
  open,
  onClose,
  orders,
  couriers,
  onCommit,
  onBagCreated,
}: Props) {
  const [courierId, setCourierId] = useState<string>("");
  const [q, setQ] = useState("");
  const [flash, setFlash] = useState<Flash>(null);

  const [movedIds, setMovedIds] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const courier = useMemo(
    () => couriers.find((c) => c.id === courierId) || null,
    [couriers, courierId],
  );

  // shu kuryerga oldindan biriktirilganlar:
  const planned = useMemo(() => {
    if (!courierId) return [];
    return orders.filter(
      (o) => o.courierId === courierId && o.status !== "assigned",
    );
  }, [orders, courierId]);

  const left = useMemo(() => {
    const base = planned.filter((o) => !movedIds.includes(o.id));
    if (!q.trim()) return base;
    const s = q.trim().toLowerCase();
    return base.filter(
      (o) => o.code.toLowerCase().includes(s) || o.barcode.includes(s),
    );
  }, [planned, movedIds, q]);

  const right = useMemo(
    () => planned.filter((o) => movedIds.includes(o.id)),
    [planned, movedIds],
  );

  // modal ochilganda reset
  // modal ochilganda reset (✅ fokus bermaymiz)
  useEffect(() => {
    if (!open) return;
    setCourierId("");
    setQ("");
    setMovedIds([]);
    setFlash(null);

    // ✅ hech qanday focus yo‘q
    // inputRef.current?.blur();  // xohlasangiz qo‘yishingiz mumkin
  }, [open]);

  function tone(ok: boolean) {
    try {
      const ctx = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = ok ? 880 : 220;
      g.gain.value = 0.08;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      setTimeout(
        () => {
          o.stop();
          ctx.close();
        },
        ok ? 90 : 180,
      );
    } catch {}
  }

  function showFlash(next: Flash) {
    setFlash(next);
    if (!next) return;
    setTimeout(() => setFlash(null), 1100);
  }

  function normalizeBarcode(s: string) {
    return String(s || "").trim();
  }

  function handleScan(barcodeRaw: string) {
    const bc = normalizeBarcode(barcodeRaw);
    if (!bc) return;

    if (!courierId) {
      tone(false);
      showFlash({ type: "err", text: "Avval kuryerni tanlang." });
      return;
    }

    const target = planned.find((o) => o.barcode === bc);

    if (!target) {
      tone(false);
      showFlash({
        type: "err",
        text: "Xato: bu barcode tanlangan kuryerga tegishli emas.",
      });
      return;
    }

    if (movedIds.includes(target.id)) {
      tone(false);
      showFlash({ type: "err", text: "Bu zakaz allaqachon tasdiqlangan." });
      return;
    }

    tone(true);
    showFlash({ type: "ok", text: "Tasdiqlandi" });
    setMovedIds((prev) => [...prev, target.id]);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = (e.currentTarget.value || "").trim();
      e.currentTarget.value = "";
      handleScan(val);
    }
  }

  const canCommit = Boolean(courierId) && movedIds.length > 0;

  const [resultOpen, setResultOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [chekUrl, setChekUrl] = useState<string>("");

  async function buildBarcodeDataUrl(text: string) {
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, text, {
      format: "CODE128",
      displayValue: false,
      margin: 0,
      height: 42,
    });
    return canvas.toDataURL("image/png");
  }

  async function makePdfList(list: Order[], courierName: string) {
    const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

    pdf.setFontSize(14);
    pdf.text("Kuryerga topshirish ro‘yxati", 14, 14);
    pdf.setFontSize(10);
    pdf.text(`Kuryer: ${courierName}`, 14, 20);
    pdf.text(`Sana: ${fmtDate(new Date().toISOString())}`, 14, 25);
    pdf.text(`Jami zakaz: ${list.length}`, 14, 30);

    let y = 38;

    for (let i = 0; i < list.length; i++) {
      const o = list[i];

      if (y > 270) {
        pdf.addPage();
        y = 18;
      }

      // card border
      pdf.setDrawColor(226, 232, 240);
      pdf.roundedRect(14, y, 182, 26, 3, 3, "S");

      // barcode image
      const bcImg = await buildBarcodeDataUrl(o.barcode);
      pdf.addImage(bcImg, "PNG", 16, y + 6, 60, 12);

      pdf.setFontSize(10);
      pdf.text(`Kod: ${o.code}`, 80, y + 10);
      pdf.text(`Barcode: ${o.barcode}`, 80, y + 15);
      pdf.setFontSize(9);
      pdf.text(`${o.sender.city} → ${o.recipient.city}`, 80, y + 20);

      y += 30;
    }

    const url = pdf.output("bloburl");
    return url;
  }

  async function makeChek(list: Order[], courierName: string) {
    const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
    const totalPieces = list.reduce((a, b) => a + (b.pieces || 0), 0);
    const totalWeight = list.reduce((a, b) => a + (b.weightKg || 0), 0);

    pdf.setFontSize(16);
    pdf.text("TOPSHIRISH CHEKI", 14, 16);

    pdf.setFontSize(11);
    pdf.text(`Kuryer: ${courierName}`, 14, 28);
    pdf.text(`Sana: ${fmtDate(new Date().toISOString())}`, 14, 35);
    pdf.text(`Zakazlar soni: ${list.length}`, 14, 42);
    pdf.text(`Dona: ${totalPieces}`, 14, 49);
    pdf.text(`Og‘irlik: ${totalWeight.toFixed(1)} kg`, 14, 56);

    pdf.setDrawColor(226, 232, 240);
    pdf.line(14, 64, 196, 64);

    pdf.setFontSize(11);
    pdf.text("Operator imzo: ____________________", 14, 80);
    pdf.text("Kuryer imzo:    ____________________", 14, 92);

    const url = pdf.output("bloburl");
    return url;
  }

  async function commit() {
  if (!courier) return;

  const list = right;
  if (!list.length) {
    tone(false);
    showFlash({ type: "err", text: "Hech bo‘lmasa 1 ta zakazni tasdiqlang." });
    return;
  }

  onCommit(list.map((x) => x.id));

  // ✅ qop yaratish
  onBagCreated?.({ courierId, orderIds: list.map((x) => x.id) });

  const url1 = await makePdfList(list, courier.name);
  const url2 = await makeChek(list, courier.name);

  setPdfUrl(url1);
  setChekUrl(url2);

  setResultOpen(true);
}


  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="Kuryerga topshirish (Scan)"
        widthClass="max-w-6xl"
      >
        {/* top controls */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="min-w-[220px]">
              <div className="text-xs text-slate-500 mb-1">Kuryer</div>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                value={courierId}
                onChange={(e) => {
                  setCourierId(e.target.value);
                  setMovedIds([]);
                  setTimeout(() => inputRef.current?.focus(), 20);
                }}
              >
                <option value="">Kuryer tanlang…</option>
                {couriers
                  .filter((c) => c.active)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex-1 min-w-[260px]">
              <div className="text-xs text-slate-500 mb-1">
                Skaner input (Enter bilan)
              </div>
              <input
                ref={inputRef}
                onKeyDown={onKeyDown}
                placeholder="Barcode skaner qiling…"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-slate-200"
                inputMode="none"
                autoComplete="off"
              />
              {/* <div className="text-[11px] text-slate-500 mt-1">
                Tip: input doim fokusda turadi. Skaner yuborgan barcode Enter bilan tasdiqlanadi.
              </div> */}
            </div>

            {/* <div className="min-w-[220px]">
              <div className="text-xs text-slate-500 mb-1">Qidirish</div>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Kod yoki barcode…"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div> */}

            <div className="ml-auto flex items-center gap-2">
              <div className="text-xs text-slate-500">
                <span className="mr-2">
                  Reja: <b className="text-slate-900">{planned.length}</b>
                </span>
                <span className="mr-2">
                  Tasdiq: <b className="text-slate-900">{right.length}</b>
                </span>
                <span>
                  Qoldi:{" "}
                  <b className="text-slate-900">
                    {Math.max(0, planned.length - right.length)}
                  </b>
                </span>
              </div>
              <Button variant="primary" disabled={!canCommit} onClick={commit}>
                Tasdiqlash
              </Button>
            </div>
          </div>

          {flash ? (
            <div
              className={[
                "mt-3 rounded-xl px-3 py-2 text-sm ring-1",
                flash.type === "ok"
                  ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                  : "bg-rose-50 text-rose-800 ring-rose-200",
              ].join(" ")}
            >
              {flash.text}
            </div>
          ) : null}
        </div>

        {/* two panes */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Panel
            title="Kutilayotgan"
            subtitle={
              courier
                ? `Tanlangan kuryer: ${courier.name}`
                : "Kuryer tanlanmagan"
            }
            count={left.length}
            tone="left"
          >
            {courierId && planned.length === 0 ? (
              <Empty text="Bu kuryerga biriktirilgan zakaz yo‘q." />
            ) : left.length ? (
              <div className="space-y-2">
                {left.map((o) => (
                  <OrderMini key={o.id} o={o} />
                ))}
              </div>
            ) : planned.length ? (
              <Empty text="Hammasi tasdiqlandi ✅" />
            ) : (
              <Empty text="Kuryer tanlang, ro‘yxat chiqadi." />
            )}
          </Panel>

          <Panel
            title="Tasdiqlangan"
            subtitle="Skaner orqali o‘tganlar shu yerga tushadi"
            count={right.length}
            tone="right"
          >
            {right.length ? (
              <div className="space-y-2">
                {right.map((o) => (
                  <OrderMini key={o.id} o={o} done />
                ))}
              </div>
            ) : (
              <Empty text="Hozircha tasdiqlangan zakaz yo‘q." />
            )}
          </Panel>
        </div>
      </Modal>

      {/* Result modal: PDF / Chek */}
      <Modal
        open={resultOpen}
        onClose={() => setResultOpen(false)}
        title="Topshirish yakunlandi"
        widthClass="max-w-xl"
      >
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-sm text-slate-700">
            Statuslar <b>kuryerga berildi</b> holatiga o‘tkazildi.
          </div>

          <div className="mt-3 flex gap-2 flex-wrap">
            <Button
              variant="primary"
              disabled={!pdfUrl}
              onClick={() =>
                window.open(pdfUrl, "_blank", "noopener,noreferrer")
              }
            >
              PDF
            </Button>

            <Button
              variant="outline"
              disabled={!chekUrl}
              onClick={() =>
                window.open(chekUrl, "_blank", "noopener,noreferrer")
              }
            >
              Chek
            </Button>

            <div className="ml-auto">
              <Button variant="outline" onClick={() => setResultOpen(false)}>
                Yopish
              </Button>
            </div>
          </div>

          <div className="mt-3 text-[11px] text-slate-500">
            PDF ichida zakazlar ro‘yxati va har biriga barcode rasm bor.
          </div>
        </div>
      </Modal>
    </>
  );
}

/* UI small components */

function Panel({
  title,
  subtitle,
  count,
  tone,
  children,
}: {
  title: string;
  subtitle: string;
  count: number;
  tone: "left" | "right";
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <div className="text-xs text-slate-500">{subtitle}</div>
        </div>

        <span
          className={[
            "inline-flex items-center rounded-full px-3 py-1 text-xs ring-1",
            tone === "left"
              ? "bg-slate-50 text-slate-700 ring-slate-200"
              : "bg-emerald-50 text-emerald-800 ring-emerald-200",
          ].join(" ")}
        >
          {count}
        </span>
      </div>

      <div className="p-4 max-h-[520px] overflow-auto">{children}</div>
    </div>
  );
}

function OrderMini({ o, done }: { o: Order; done?: boolean }) {
  return (
    <div
      className={[
        "rounded-2xl border p-3 transition",
        done
          ? "border-emerald-200 bg-emerald-50"
          : "border-slate-200 bg-white hover:bg-slate-50",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900 truncate">
            {o.code}
          </div>
          <div className="text-xs text-slate-600 mt-0.5">{o.barcode}</div>
          <div className="text-xs text-slate-500 mt-1">
            {o.sender.city} → {o.recipient.city}
          </div>
        </div>

        {done ? (
          <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200">
            Tasdiqlandi
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600 ring-1 ring-slate-200">
            Kutilmoqda
          </span>
        )}
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
      {text}
    </div>
  );
}
