"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Button from "./ui/Button";
import {
  X,
  Search,
  BadgeCheck,
  Truck,
  MapPin,
  ShieldAlert,
  Banknote,
  Calendar,
  Clock3,
} from "lucide-react";
import { useOrders } from "../state/OrdersProvider";
import type { OrderStatus } from "../../model/types";

type CourierLite = { id: string; name: string };
type SlaRisk = "low" | "medium" | "high";

const ALL_STATUS: Array<{ v: OrderStatus; label: string }> = [
  { v: "processing", label: "Qayta ishlanmoqda" },
  { v: "assigned", label: "Biriktirilgan" },
  { v: "picked", label: "Olib ketildi" },
  { v: "in_transit", label: "Yo‘lda" },
  { v: "out_for_delivery", label: "Yetkazishga chiqdi" },
  { v: "delivered", label: "Yetkazildi" },
  { v: "postponed", label: "Kechiktirildi" },
  { v: "cancelled", label: "Bekor qilindi" },
  { v: "returned", label: "Qaytarildi" },
];

const SLA_OPTIONS: Array<{ v: SlaRisk; label: string }> = [
  { v: "low", label: "Past" },
  { v: "medium", label: "O‘rtacha" },
  { v: "high", label: "Yuqori" },
];

/* =========================
 * Small helpers
 * ========================= */
function toggleArr<T>(arr: T[], v: T) {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

function keepNumeric(v: string) {
  return v.replace(/[^\d.]/g, "");
}

function toNumOrUndef(v: string) {
  const s = v.trim();
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatDMY(iso: string) {
  // iso: yyyy-MM-dd
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return "";
  return `${d}.${m}.${y}`;
}

function toISODate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function fromISODate(iso?: string) {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

const UZ_MONTHS = [
  "Yanvar",
  "Fevral",
  "Mart",
  "Aprel",
  "May",
  "Iyun",
  "Iyul",
  "Avgust",
  "Sentabr",
  "Oktabr",
  "Noyabr",
  "Dekabr",
];

const UZ_WEEKDAYS_SHORT = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];

// Monday-first (Du..Ya) grid for current month
function buildMonthGrid(y: number, m: number) {
  // returns 42 cells (6 weeks * 7)
  const first = new Date(y, m, 1);
  const firstDowSun0 = first.getDay(); // 0..6 (Sun..Sat)
  const firstDowMon0 = (firstDowSun0 + 6) % 7; // 0..6 (Mon..Sun)
  const start = new Date(y, m, 1 - firstDowMon0);

  const cells: Array<null | { iso: string; day: number; inMonth: boolean }> = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const iso = toISODate(d);
    const inMonth = d.getMonth() === m;
    cells.push({ iso, day: d.getDate(), inMonth });
  }
  return cells;
}

function clampPopoverPos(
  anchorRect: DOMRect,
  popW: number,
  popH: number,
  prefer: "bottom" | "top" = "bottom",
) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const gap = 8;

  let left = anchorRect.left;
  // keep within viewport
  left = Math.max(gap, Math.min(left, vw - popW - gap));

  const bottomY = anchorRect.bottom + gap;
  const topY = anchorRect.top - popH - gap;

  let top = prefer === "top" ? topY : bottomY;

  // if overflow bottom, move top
  if (top + popH + gap > vh) top = topY;
  // if still overflow top, fallback bottom
  if (top < gap) top = bottomY;

  top = Math.max(gap, Math.min(top, vh - popH - gap));

  return { top, left };
}

/* =========================
 * Portal Popover (NO CLIP)
 * ========================= */
function PortalPopover({
  open,
  anchorRef,
  onClose,
  width = 360,
  children,
}: {
  open: boolean;
  anchorRef: React.RefObject<HTMLElement>;
  onClose: () => void;
  width?: number;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;

    const calc = () => {
      const a = anchorRef.current;
      if (!a) return;
      // estimate height (we will adjust after render too)
      const estH = 360;
      const rect = a.getBoundingClientRect();
      const p = clampPopoverPos(rect, width, estH, "bottom");
      setPos(p);
    };

    calc();
    window.addEventListener("resize", calc);
    window.addEventListener("scroll", calc, true);
    return () => {
      window.removeEventListener("resize", calc);
      window.removeEventListener("scroll", calc, true);
    };
  }, [open, anchorRef, width]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const a = anchorRef.current;
      const p = panelRef.current;
      const t = e.target as Node;
      if (!a || !p) return;
      if (a.contains(t) || p.contains(t)) return;
      onClose();
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open, onClose, anchorRef]);

  if (!open || !mounted || !pos) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      <div
        ref={panelRef}
        style={{ top: pos.top, left: pos.left, width }}
        className="pointer-events-auto absolute rounded-2xl border border-slate-200 bg-white shadow-2xl ring-1 ring-black/5"
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

/* =========================
 * Calendar Popover (3-rasm vibe)
 * ========================= */
function IconGhostButton({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="grid h-9 w-9 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
    >
      <span className="text-lg leading-none">{children}</span>
    </button>
  );
}

function CalendarPopover({
  open,
  anchorRef,
  onClose,
  valueISO,
  onChange,
}: {
  open: boolean;
  anchorRef: React.RefObject<HTMLElement>;
  onClose: () => void;
  valueISO: string | null;
  onChange: (iso: string) => void;
}) {
  const todayISO = toISODate(new Date());

  const initial = useMemo(() => {
    const base = fromISODate(valueISO || "") ?? new Date();
    return { y: base.getFullYear(), m: base.getMonth() };
  }, [valueISO]);

  const [view, setView] = useState<{ y: number; m: number }>(initial);

  useEffect(() => {
    if (!open) return;
    setView(initial);
  }, [open, initial]);

  const monthTitle = `${UZ_MONTHS[view.m]} ${view.y}`;
  const grid = useMemo(() => buildMonthGrid(view.y, view.m), [view.y, view.m]);

  function prevMonth() {
    setView((v) => {
      const m = v.m - 1;
      if (m < 0) return { y: v.y - 1, m: 11 };
      return { ...v, m };
    });
  }
  function nextMonth() {
    setView((v) => {
      const m = v.m + 1;
      if (m > 11) return { y: v.y + 1, m: 0 };
      return { ...v, m };
    });
  }

  return (
    <PortalPopover open={open} anchorRef={anchorRef} onClose={onClose} width={380}>
      <div className="p-3">
        {/* Month header */}
        <div className="flex items-center justify-between px-1">
          <div className="text-sm font-semibold text-slate-900">{monthTitle}</div>
          <div className="flex items-center gap-1.5">
            <IconGhostButton onClick={prevMonth} title="Oldingi oy">
              ‹
            </IconGhostButton>
            <IconGhostButton onClick={nextMonth} title="Keyingi oy">
              ›
            </IconGhostButton>
          </div>
        </div>

        {/* Weekdays */}
        <div className="mt-3 grid grid-cols-7 gap-1">
          {UZ_WEEKDAYS_SHORT.map((w) => (
            <div
              key={w}
              className="px-1 py-1 text-center text-[11px] font-semibold text-slate-400"
            >
              {w}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="mt-1 grid grid-cols-7 gap-1">
          {grid.map((cell, idx) => {
            if (!cell) return <div key={idx} className="h-9" />;

            const iso = cell.iso;
            const isToday = iso === todayISO;
            const isActive = iso === (valueISO ?? todayISO);
            const inMonth = cell.inMonth;

            const base = "h-9 rounded-xl text-sm font-semibold transition grid place-items-center relative";
            const ring = isActive
              ? "bg-blue-600 text-white shadow-[0_10px_20px_rgba(37,99,235,0.25)]"
              : "bg-white text-slate-700 hover:bg-slate-50";

            // outside month dim
            const dim = inMonth ? "" : "opacity-40";

            return (
              <button
                type="button"
                key={iso}
                onClick={() => {
                  onChange(iso);
                  onClose();
                }}
                className={[base, ring, "ring-1 ring-slate-200", dim].join(" ")}
              >
                {cell.day}
                {isToday && !isActive ? (
                  <span className="absolute -bottom-0.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-blue-600" />
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onChange(todayISO);
              onClose();
            }}
            className="rounded-2xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            Bugun
          </button>
          <button
            type="button"
            onClick={() => onClose()}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Yopish
          </button>
        </div>
      </div>
    </PortalPopover>
  );
}

/* =========================
 * Time Popover (nice)
 * ========================= */
function TimePopover({
  open,
  anchorRef,
  onClose,
  value,
  onChange,
}: {
  open: boolean;
  anchorRef: React.RefObject<HTMLElement>;
  onClose: () => void;
  value: string; // "HH:mm" | ""
  onChange: (v: string) => void;
}) {
  const hh = value ? Number(value.split(":")[0] ?? 0) : 0;
  const mm = value ? Number(value.split(":")[1] ?? 0) : 0;

  const [hour, setHour] = useState(hh);
  const [min, setMin] = useState(mm);

  useEffect(() => {
    if (!open) return;
    setHour(hh);
    setMin(mm);
  }, [open, hh, mm]);

  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  const mins = useMemo(() => Array.from({ length: 60 }, (_, i) => i), []);

  return (
    <PortalPopover open={open} anchorRef={anchorRef} onClose={onClose} width={320}>
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900">Soat tanlash</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2">
            <div className="text-[11px] font-semibold text-slate-500 px-1 mb-2">Soat</div>
            <div className="max-h-56 overflow-auto pr-1">
              {hours.map((h) => {
                const on = h === hour;
                return (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHour(h)}
                    className={[
                      "w-full text-left px-3 py-2 rounded-xl text-sm font-semibold transition",
                      on ? "bg-blue-600 text-white" : "hover:bg-white text-slate-700",
                    ].join(" ")}
                  >
                    {pad2(h)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2">
            <div className="text-[11px] font-semibold text-slate-500 px-1 mb-2">Daqiqa</div>
            <div className="max-h-56 overflow-auto pr-1">
              {mins.map((m) => {
                const on = m === min;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMin(m)}
                    className={[
                      "w-full text-left px-3 py-2 rounded-xl text-sm font-semibold transition",
                      on ? "bg-blue-600 text-white" : "hover:bg-white text-slate-700",
                    ].join(" ")}
                  >
                    {pad2(m)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onChange("");
              onClose();
            }}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Tozalash
          </button>

          <button
            type="button"
            onClick={() => {
              onChange(`${pad2(hour)}:${pad2(min)}`);
              onClose();
            }}
            className="rounded-2xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            Tanlash
          </button>
        </div>
      </div>
    </PortalPopover>
  );
}

/* =========================
 * UI atoms
 * ========================= */
function FieldLabel({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="text-xs text-slate-500 mb-1 flex items-center gap-2">
      {icon}
      {title}
    </div>
  );
}

function Chip({
  active,
  children,
  onClick,
  tone = "neutral",
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  tone?: "neutral" | "success" | "indigo";
}) {
  const onCls =
    tone === "success"
      ? "bg-emerald-600 ring-emerald-600"
      : tone === "indigo"
        ? "bg-indigo-600 ring-indigo-600"
        : "bg-slate-900 ring-slate-900";

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "px-3 py-2 rounded-2xl text-xs font-semibold ring-1 transition",
        active
          ? `text-white ${onCls}`
          : "bg-white text-slate-700 ring-slate-200 hover:ring-slate-300",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

/* =========================
 * Main FiltersModal
 * ========================= */
export default function FiltersModal({
  open,
  onClose,
  cities,
  couriers,
}: {
  open: boolean;
  onClose: () => void;
  cities: string[];
  couriers: CourierLite[];
}) {
  const { query, setQuery, setPage } = useOrders();

  // draft state
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [courierId, setCourierId] = useState("");
  const [statuses, setStatuses] = useState<OrderStatus[]>([]);
  const [slaRisk, setSlaRisk] = useState<SlaRisk[]>([]);
  const [minTotal, setMinTotal] = useState("");
  const [maxTotal, setMaxTotal] = useState("");

  // date+time (ISO date + "HH:mm")
  const [dateFromISO, setDateFromISO] = useState<string | null>(null);
  const [dateToISO, setDateToISO] = useState<string | null>(null);
  const [timeFrom, setTimeFrom] = useState<string>("");
  const [timeTo, setTimeTo] = useState<string>("");

  // popovers
  const fromBtnRef = useRef<HTMLButtonElement | null>(null);
  const toBtnRef = useRef<HTMLButtonElement | null>(null);
  const timeFromRef = useRef<HTMLButtonElement | null>(null);
  const timeToRef = useRef<HTMLButtonElement | null>(null);

  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);
  const [tFromOpen, setTFromOpen] = useState(false);
  const [tToOpen, setTToOpen] = useState(false);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  const sortedCities = useMemo(
    () => [...(cities || [])].filter(Boolean).sort((a, b) => a.localeCompare(b)),
    [cities],
  );
  const sortedCouriers = useMemo(
    () => [...(couriers || [])].sort((a, b) => a.name.localeCompare(b.name)),
    [couriers],
  );

  // sync from global query
  useEffect(() => {
    if (!open) return;

    setQ(query.q || "");
    setCity(query.city || "");
    setCourierId(query.courierId ?? "");
    setStatuses((query.statuses || []) as OrderStatus[]);
    setSlaRisk((query.slaRisk || []) as SlaRisk[]);
    setMinTotal(query.minTotal === undefined ? "" : String(query.minTotal));
    setMaxTotal(query.maxTotal === undefined ? "" : String(query.maxTotal));

    setDateFromISO(query.dateFrom || null);
    setDateToISO(query.dateTo || null);

    setTimeFrom((query as any).timeFrom || "");
    setTimeTo((query as any).timeTo || "");

    // close popovers
    setFromOpen(false);
    setToOpen(false);
    setTFromOpen(false);
    setTToOpen(false);

    setTimeout(() => {
      panelRef.current?.focus();
      searchRef.current?.focus();
    }, 0);
  }, [open, query]);

  // body lock + ESC
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  const activeCount = useMemo(() => {
    let n = 0;
    if (q.trim()) n++;
    if (statuses.length) n++;
    if (city) n++;
    if (courierId) n++;
    if (slaRisk.length) n++;
    if (dateFromISO) n++;
    if (dateToISO) n++;
    if (timeFrom) n++;
    if (timeTo) n++;
    if (minTotal.trim() !== "") n++;
    if (maxTotal.trim() !== "") n++;
    return n;
  }, [q, statuses, city, courierId, slaRisk, dateFromISO, dateToISO, timeFrom, timeTo, minTotal, maxTotal]);

  const apply = () => {
    setPage(1);
    setQuery({
      q: q.trim() || undefined,
      city: city || undefined,
      courierId: courierId || undefined,
      dateFrom: dateFromISO || undefined,
      dateTo: dateToISO || undefined,
      ...(timeFrom ? ({ timeFrom } as any) : {}),
      ...(timeTo ? ({ timeTo } as any) : {}),
      minTotal: toNumOrUndef(minTotal),
      maxTotal: toNumOrUndef(maxTotal),
      statuses: statuses.length ? (statuses as any) : undefined,
      slaRisk: slaRisk.length ? (slaRisk as any) : undefined,
    });
    onClose();
  };

  const reset = () => {
    setQ("");
    setCity("");
    setCourierId("");
    setStatuses([]);
    setSlaRisk([]);
    setMinTotal("");
    setMaxTotal("");
    setDateFromISO(null);
    setDateToISO(null);
    setTimeFrom("");
    setTimeTo("");
    setPage(1);
    setQuery({});
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay */}
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close"
      />

      {/* panel */}
      <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-6">
        <div
          ref={panelRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label="Filtrlar"
          className="w-full max-w-6xl rounded-[28px] bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden"
        >
          {/* header */}
          <div className="px-5 sm:px-6 py-4 border-b border-slate-200 flex items-start gap-3">
            <div className="flex-1">
              <div className="text-base sm:text-lg font-semibold text-slate-900">
                Filtrlar
                {activeCount ? (
                  <span className="ml-2 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-700">
                    {activeCount} ta aktiv
                  </span>
                ) : null}
              </div>
              <div className="text-xs sm:text-sm text-slate-500">
                Zakazlarni tez va aniq filtrlash
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-2xl hover:bg-slate-100 text-slate-600"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* body */}
          <div className="p-4 sm:p-6">
            <div className="rounded-3xl border border-slate-200 bg-slate-50/40 p-4 sm:p-5">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                {/* Row 1 */}
                <div className="lg:col-span-5">
                  <FieldLabel icon={<Search className="h-4 w-4" />} title="Qidirish" />
                  <input
                    ref={searchRef}
                    className="h-11 w-full px-3 rounded-2xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-slate-200"
                    placeholder="Kod, barcode, ism, telefon, manzil..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </div>

                <div className="lg:col-span-3">
                  <FieldLabel icon={<MapPin className="h-4 w-4" />} title="Shahar" />
                  <select
                    className="h-11 w-full px-3 rounded-2xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-slate-200"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  >
                    <option value="">Barchasi</option>
                    {sortedCities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="lg:col-span-4">
                  <FieldLabel icon={<Truck className="h-4 w-4" />} title="Kuryer" />
                  <select
                    className="h-11 w-full px-3 rounded-2xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-slate-200"
                    value={courierId}
                    onChange={(e) => setCourierId(e.target.value)}
                  >
                    <option value="">Barchasi</option>
                    {sortedCouriers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Row 2 */}
                <div className="lg:col-span-8">
                  <FieldLabel icon={<BadgeCheck className="h-4 w-4" />} title="Status" />
                  <div className="flex flex-wrap gap-2">
                    <Chip active={statuses.length === 0} onClick={() => setStatuses([])}>
                      Barchasi
                    </Chip>
                    {ALL_STATUS.map((s) => (
                      <Chip
                        key={s.v}
                        active={statuses.includes(s.v)}
                        onClick={() => setStatuses(toggleArr(statuses, s.v))}
                        tone="success"
                      >
                        {s.label}
                      </Chip>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-4">
                  <FieldLabel icon={<ShieldAlert className="h-4 w-4" />} title="SLA risk" />
                  <div className="flex flex-wrap gap-2">
                    <Chip active={slaRisk.length === 0} onClick={() => setSlaRisk([])}>
                      Barchasi
                    </Chip>
                    {SLA_OPTIONS.map((x) => (
                      <Chip
                        key={x.v}
                        active={slaRisk.includes(x.v)}
                        onClick={() => setSlaRisk(toggleArr(slaRisk, x.v))}
                        tone="indigo"
                      >
                        {x.label}
                      </Chip>
                    ))}
                  </div>
                </div>

                {/* Row 3: Date + Time */}
                <div className="lg:col-span-3">
                  <FieldLabel icon={<Calendar className="h-4 w-4" />} title="Sana (dan)" />
                  <button
                    ref={fromBtnRef}
                    type="button"
                    onClick={() => {
                      setToOpen(false);
                      setTFromOpen(false);
                      setTToOpen(false);
                      setFromOpen((s) => !s);
                    }}
                    className="h-11 w-full px-3 rounded-2xl border border-slate-200 bg-white text-left hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span className={dateFromISO ? "text-slate-900 font-semibold" : "text-slate-400"}>
                      {dateFromISO ? formatDMY(dateFromISO) : "DD.MM.YYYY"}
                    </span>
                    <Calendar className="h-4 w-4 text-slate-400" />
                  </button>

                  <CalendarPopover
                    open={fromOpen}
                    anchorRef={fromBtnRef as any}
                    onClose={() => setFromOpen(false)}
                    valueISO={dateFromISO}
                    onChange={(iso) => setDateFromISO(iso)}
                  />
                </div>

                <div className="lg:col-span-3">
                  <FieldLabel icon={<Calendar className="h-4 w-4" />} title="Sana (gacha)" />
                  <button
                    ref={toBtnRef}
                    type="button"
                    onClick={() => {
                      setFromOpen(false);
                      setTFromOpen(false);
                      setTToOpen(false);
                      setToOpen((s) => !s);
                    }}
                    className="h-11 w-full px-3 rounded-2xl border border-slate-200 bg-white text-left hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span className={dateToISO ? "text-slate-900 font-semibold" : "text-slate-400"}>
                      {dateToISO ? formatDMY(dateToISO) : "DD.MM.YYYY"}
                    </span>
                    <Calendar className="h-4 w-4 text-slate-400" />
                  </button>

                  <CalendarPopover
                    open={toOpen}
                    anchorRef={toBtnRef as any}
                    onClose={() => setToOpen(false)}
                    valueISO={dateToISO}
                    onChange={(iso) => setDateToISO(iso)}
                  />
                </div>

                <div className="lg:col-span-3">
                  <FieldLabel icon={<Clock3 className="h-4 w-4" />} title="Soat (dan)" />
                  <button
                    ref={timeFromRef}
                    type="button"
                    onClick={() => {
                      setFromOpen(false);
                      setToOpen(false);
                      setTToOpen(false);
                      setTFromOpen((s) => !s);
                    }}
                    className="h-11 w-full px-3 rounded-2xl border border-slate-200 bg-white text-left hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span className={timeFrom ? "text-slate-900 font-semibold" : "text-slate-400"}>
                      {timeFrom || "--:--"}
                    </span>
                    <Clock3 className="h-4 w-4 text-slate-400" />
                  </button>

                  <TimePopover
                    open={tFromOpen}
                    anchorRef={timeFromRef as any}
                    onClose={() => setTFromOpen(false)}
                    value={timeFrom}
                    onChange={(v) => setTimeFrom(v)}
                  />
                </div>

                <div className="lg:col-span-3">
                  <FieldLabel icon={<Clock3 className="h-4 w-4" />} title="Soat (gacha)" />
                  <button
                    ref={timeToRef}
                    type="button"
                    onClick={() => {
                      setFromOpen(false);
                      setToOpen(false);
                      setTFromOpen(false);
                      setTToOpen((s) => !s);
                    }}
                    className="h-11 w-full px-3 rounded-2xl border border-slate-200 bg-white text-left hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span className={timeTo ? "text-slate-900 font-semibold" : "text-slate-400"}>
                      {timeTo || "--:--"}
                    </span>
                    <Clock3 className="h-4 w-4 text-slate-400" />
                  </button>

                  <TimePopover
                    open={tToOpen}
                    anchorRef={timeToRef as any}
                    onClose={() => setTToOpen(false)}
                    value={timeTo}
                    onChange={(v) => setTimeTo(v)}
                  />
                </div>

                {/* Row 4: totals */}
                <div className="lg:col-span-3">
                  <FieldLabel icon={<Banknote className="h-4 w-4" />} title="Min summa" />
                  <input
                    className="h-11 w-full px-3 rounded-2xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-slate-200"
                    placeholder="0"
                    inputMode="numeric"
                    value={minTotal}
                    onChange={(e) => setMinTotal(keepNumeric(e.target.value))}
                  />
                </div>

                <div className="lg:col-span-3">
                  <FieldLabel icon={<Banknote className="h-4 w-4" />} title="Max summa" />
                  <input
                    className="h-11 w-full px-3 rounded-2xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-slate-200"
                    placeholder="..."
                    inputMode="numeric"
                    value={maxTotal}
                    onChange={(e) => setMaxTotal(keepNumeric(e.target.value))}
                  />
                </div>

                <div className="lg:col-span-6">
                  <div className="rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-600">
                    <div className="font-semibold text-slate-900 mb-1">Maslahat:</div>
                    Sana va soat tanlasangiz, backend shu interval bo‘yicha filtrlaydi.
                    Agar backend vaqtni qabul qilmasa, `timeFrom/timeTo` ni API’da qo‘shish kerak bo‘ladi.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* footer */}
          <div className="px-4 sm:px-6 py-4 border-t border-slate-200 bg-white">
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
              <div className="text-xs text-slate-500">
                {activeCount ? `${activeCount} ta filter tanlangan` : "Filter tanlanmagan"}
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="secondary" onClick={reset}>
                  Tozalash
                </Button>
                <Button onClick={apply}>Qo‘llash</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
