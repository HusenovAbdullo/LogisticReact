"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Button from "./ui/Button";
import { X, Search, Calendar, BadgeCheck, Truck, MapPin, ShieldAlert, Banknote } from "lucide-react";
import { useOrders } from "../state/OrdersProvider";
import type { OrderStatus } from "../../model/types";

type CourierLite = { id: string; name: string };

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

type SlaRisk = "low" | "medium" | "high";
const SLA_OPTIONS: Array<{ v: SlaRisk; label: string }> = [
  { v: "low", label: "Past" },
  { v: "medium", label: "O‘rtacha" },
  { v: "high", label: "Yuqori" },
];

function toggleArr<T>(arr: T[], v: T) {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

function numOrEmpty(v: string) {
  if (v.trim() === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

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

  // local draft state
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [courierId, setCourierId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minTotal, setMinTotal] = useState("");
  const [maxTotal, setMaxTotal] = useState("");
  const [statuses, setStatuses] = useState<OrderStatus[]>([]);
  const [slaRisk, setSlaRisk] = useState<SlaRisk[]>([]);

  const panelRef = useRef<HTMLDivElement | null>(null);

  // when modal opens — sync local state from global query
  useEffect(() => {
    if (!open) return;

    setQ(query.q || "");
    setCity(query.city || "");
    setCourierId(query.courierId ?? "");
    setDateFrom(query.dateFrom || "");
    setDateTo(query.dateTo || "");
    setMinTotal(query.minTotal === undefined ? "" : String(query.minTotal));
    setMaxTotal(query.maxTotal === undefined ? "" : String(query.maxTotal));
    setStatuses((query.statuses || []) as OrderStatus[]);
    setSlaRisk((query.slaRisk || []) as SlaRisk[]);

    // focus panel for ESC handling
    setTimeout(() => panelRef.current?.focus(), 0);
  }, [open, query]);

  // ESC close
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const activeCount = useMemo(() => {
    let n = 0;
    if (q.trim()) n++;
    if (statuses.length) n++;
    if (city) n++;
    if (courierId) n++;
    if (slaRisk.length) n++;
    if (dateFrom) n++;
    if (dateTo) n++;
    if (minTotal.trim() !== "") n++;
    if (maxTotal.trim() !== "") n++;
    return n;
  }, [q, statuses, city, courierId, slaRisk, dateFrom, dateTo, minTotal, maxTotal]);

  const apply = () => {
    setPage(1);
    setQuery({
      q: q.trim() || undefined,
      city: city || undefined,
      courierId: courierId === "" ? undefined : courierId,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      minTotal: numOrEmpty(minTotal),
      maxTotal: numOrEmpty(maxTotal),
      statuses: statuses.length ? (statuses as any) : undefined,
      slaRisk: slaRisk.length ? (slaRisk as any) : undefined,
    });
    onClose();
  };

  const reset = () => {
    setQ("");
    setCity("");
    setCourierId("");
    setDateFrom("");
    setDateTo("");
    setMinTotal("");
    setMaxTotal("");
    setStatuses([]);
    setSlaRisk([]);
    setPage(1);
    setQuery({});
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* panel */}
      <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-6">
        <div
          ref={panelRef}
          tabIndex={-1}
          className="
            w-full
            max-w-5xl
            rounded-3xl
            bg-white
            shadow-2xl
            ring-1 ring-black/5
            overflow-hidden
          "
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
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-600"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* body */}
          <div className="p-4 sm:p-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4 sm:p-5">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                {/* Search */}
                <div className="md:col-span-5">
                  <div className="text-xs text-slate-500 mb-1 flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Qidirish
                  </div>
                  <input
                    className="h-11 w-full px-3 rounded-2xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-slate-200"
                    placeholder="Kod, barcode, ism, telefon, manzil..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </div>

                {/* City */}
                <div className="md:col-span-3">
                  <div className="text-xs text-slate-500 mb-1 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Shahar
                  </div>
                  <select
                    className="h-11 w-full px-3 rounded-2xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-slate-200"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  >
                    <option value="">Barchasi</option>
                    {cities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Courier */}
                <div className="md:col-span-4">
                  <div className="text-xs text-slate-500 mb-1 flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Kuryer
                  </div>
                  <select
                    className="h-11 w-full px-3 rounded-2xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-slate-200"
                    value={courierId}
                    onChange={(e) => setCourierId(e.target.value)}
                  >
                    <option value="">Barchasi</option>
                    {couriers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status chips */}
                <div className="md:col-span-8">
                  <div className="text-xs text-slate-500 mb-2 flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4" />
                    Status
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setStatuses([])}
                      className={`px-3 py-2 rounded-2xl text-xs font-semibold ring-1 transition ${
                        statuses.length === 0
                          ? "bg-slate-900 text-white ring-slate-900"
                          : "bg-white text-slate-700 ring-slate-200 hover:ring-slate-300"
                      }`}
                    >
                      Barchasi
                    </button>

                    {ALL_STATUS.map((s) => {
                      const on = statuses.includes(s.v);
                      return (
                        <button
                          key={s.v}
                          type="button"
                          onClick={() => setStatuses(toggleArr(statuses, s.v))}
                          className={`px-3 py-2 rounded-2xl text-xs font-semibold ring-1 transition ${
                            on
                              ? "bg-emerald-600 text-white ring-emerald-600"
                              : "bg-white text-slate-700 ring-slate-200 hover:ring-slate-300"
                          }`}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* SLA chips */}
                <div className="md:col-span-4">
                  <div className="text-xs text-slate-500 mb-2 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4" />
                    SLA risk
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSlaRisk([])}
                      className={`px-3 py-2 rounded-2xl text-xs font-semibold ring-1 transition ${
                        slaRisk.length === 0
                          ? "bg-slate-900 text-white ring-slate-900"
                          : "bg-white text-slate-700 ring-slate-200 hover:ring-slate-300"
                      }`}
                    >
                      Barchasi
                    </button>
                    {SLA_OPTIONS.map((x) => {
                      const on = slaRisk.includes(x.v);
                      return (
                        <button
                          key={x.v}
                          type="button"
                          onClick={() => setSlaRisk(toggleArr(slaRisk, x.v))}
                          className={`px-3 py-2 rounded-2xl text-xs font-semibold ring-1 transition ${
                            on
                              ? "bg-indigo-600 text-white ring-indigo-600"
                              : "bg-white text-slate-700 ring-slate-200 hover:ring-slate-300"
                          }`}
                        >
                          {x.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Dates */}
                <div className="md:col-span-3">
                  <div className="text-xs text-slate-500 mb-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Sana (dan)
                  </div>
                  <input
                    className="h-11 w-full px-3 rounded-2xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-slate-200"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>

                <div className="md:col-span-3">
                  <div className="text-xs text-slate-500 mb-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Sana (gacha)
                  </div>
                  <input
                    className="h-11 w-full px-3 rounded-2xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-slate-200"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>

                {/* Totals */}
                <div className="md:col-span-3">
                  <div className="text-xs text-slate-500 mb-1 flex items-center gap-2">
                    <Banknote className="h-4 w-4" />
                    Min summa
                  </div>
                  <input
                    className="h-11 w-full px-3 rounded-2xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-slate-200"
                    placeholder="0"
                    inputMode="numeric"
                    value={minTotal}
                    onChange={(e) => setMinTotal(e.target.value)}
                  />
                </div>

                <div className="md:col-span-3">
                  <div className="text-xs text-slate-500 mb-1 flex items-center gap-2">
                    <Banknote className="h-4 w-4" />
                    Max summa
                  </div>
                  <input
                    className="h-11 w-full px-3 rounded-2xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-slate-200"
                    placeholder="..."
                    inputMode="numeric"
                    value={maxTotal}
                    onChange={(e) => setMaxTotal(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* footer actions (sticky look) */}
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
