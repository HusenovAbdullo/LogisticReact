"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IconCalendar } from "@/shared/ui/icons";

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toISO(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseISO(iso: string): Date | null {
  const [y, m, d] = String(iso || "").split("-").map((x) => Number(x));
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d);
  return Number.isFinite(dt.getTime()) ? dt : null;
}

function isoToday() {
  return toISO(new Date());
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function daysInMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

// Monday-first: Mon=0..Sun=6
function weekdayMonFirst(d: Date) {
  const js = d.getDay(); // Sun=0..Sat=6
  return (js + 6) % 7;
}

const MONTHS_UZ = [
  "Yanvar",
  "Fevral",
  "Mart",
  "Aprel",
  "May",
  "Iyun",
  "Iyul",
  "Avgust",
  "Sentyabr",
  "Oktyabr",
  "Noyabr",
  "Dekabr",
];

const WEEK_UZ = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];

export function DatePillPicker({ initialISO }: { initialISO: string }) {
  const router = useRouter();
  const sp = useSearchParams();

  const urlISO = sp.get("date") ?? "";
  const selectedISO = urlISO || initialISO || isoToday();

  const [open, setOpen] = useState(false);

  // popup oynasi uchun oy (view)
  const [viewMonth, setViewMonth] = useState(() => {
    const d = parseISO(selectedISO) ?? new Date();
    return startOfMonth(d);
  });

  // URL o‘zgarsa, viewMonth ham moslansin
  useEffect(() => {
    const d = parseISO(selectedISO) ?? new Date();
    setViewMonth(startOfMonth(d));
  }, [selectedISO]);

  const rootRef = useRef<HTMLDivElement | null>(null);

  // outside click + ESC
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function pickISO(iso: string) {
    router.push(`?date=${encodeURIComponent(iso)}`); // SRAZI: SSR render
    setOpen(false);
  }

  function pickDay(day: number) {
    const d = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
    pickISO(toISO(d));
  }

  const grid = useMemo(() => {
    const first = startOfMonth(viewMonth);
    const offset = weekdayMonFirst(first);
    const count = daysInMonth(viewMonth);

    const cells: Array<number | null> = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= count; d++) cells.push(d);
    while (cells.length < 42) cells.push(null);

    return cells;
  }, [viewMonth]);

  const sel = parseISO(selectedISO);
  const selY = sel?.getFullYear();
  const selM = sel?.getMonth();
  const selD = sel?.getDate();

  const today = new Date();
  const tY = today.getFullYear();
  const tM = today.getMonth();
  const tD = today.getDate();

  const monthTitle = `${MONTHS_UZ[viewMonth.getMonth()]} ${viewMonth.getFullYear()}`;

  return (
    <div ref={rootRef} className="relative inline-block">
      {/* 2-rasmga o‘xshash pill */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200",
          "hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/25",
          "dark:bg-slate-950/40 dark:text-slate-200 dark:ring-slate-800 dark:hover:bg-slate-950",
        )}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="text-slate-500 dark:text-slate-400">Sana:</span>
        <span className="text-slate-900 dark:text-slate-100">{selectedISO}</span>
        <span className="grid h-6 w-6 place-items-center rounded-full bg-white ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <IconCalendar className="h-3.5 w-3.5 text-slate-700 dark:text-slate-200" />
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-[320px]">
          <div className="rounded-[22px] bg-white p-3 shadow-[0_18px_45px_rgba(15,23,42,0.16)] ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
            {/* header */}
            <div className="flex items-center justify-between gap-2 px-1">
              <button
                type="button"
                onClick={() => setViewMonth((m) => addMonths(m, -1))}
                className="grid h-9 w-9 place-items-center rounded-full bg-slate-50 ring-1 ring-slate-200 hover:bg-white dark:bg-slate-950/40 dark:ring-slate-800 dark:hover:bg-slate-950"
                aria-label="Oldingi oy"
              >
                <span className="text-lg leading-none text-slate-700 dark:text-slate-200">‹</span>
              </button>

              <div className="min-w-0 text-center">
                <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  {monthTitle}
                </div>
                <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Tanlangan:{" "}
                  <b className="text-slate-900 dark:text-slate-100">{selectedISO}</b>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewMonth((m) => addMonths(m, 1))}
                className="grid h-9 w-9 place-items-center rounded-full bg-slate-50 ring-1 ring-slate-200 hover:bg-white dark:bg-slate-950/40 dark:ring-slate-800 dark:hover:bg-slate-950"
                aria-label="Keyingi oy"
              >
                <span className="text-lg leading-none text-slate-700 dark:text-slate-200">›</span>
              </button>
            </div>

            {/* week */}
            <div className="mt-3 grid grid-cols-7 gap-1 px-1">
              {WEEK_UZ.map((w) => (
                <div
                  key={w}
                  className="py-2 text-center text-[11px] font-bold text-slate-500 dark:text-slate-400"
                >
                  {w}
                </div>
              ))}
            </div>

            {/* days */}
            <div className="grid grid-cols-7 gap-1 px-1 pb-1">
              {grid.map((day, idx) => {
                if (!day) return <div key={idx} className="h-10" />;

                const isSelected =
                  selY === viewMonth.getFullYear() &&
                  selM === viewMonth.getMonth() &&
                  selD === day;

                const isToday =
                  tY === viewMonth.getFullYear() &&
                  tM === viewMonth.getMonth() &&
                  tD === day;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => pickDay(day)}
                    className={cn(
                      "h-10 rounded-xl text-sm font-semibold transition",
                      "ring-1 ring-transparent hover:ring-slate-200 hover:bg-slate-50",
                      "dark:hover:bg-slate-950/40 dark:hover:ring-slate-800",
                      isToday &&
                        !isSelected &&
                        "ring-1 ring-blue-200 bg-blue-50/60 text-blue-700 dark:bg-blue-950/30 dark:text-blue-200 dark:ring-blue-900/40",
                      isSelected &&
                        "bg-blue-600 text-white ring-1 ring-blue-600 hover:bg-blue-700",
                    )}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* quick */}
            <div className="mt-2 flex items-center justify-between gap-2 px-1">
              <button
                type="button"
                onClick={() => pickISO(isoToday())}
                className="rounded-full bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-white dark:bg-slate-950/40 dark:text-slate-200 dark:ring-slate-800 dark:hover:bg-slate-950"
              >
                Bugun
              </button>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-white dark:bg-slate-950/40 dark:text-slate-200 dark:ring-slate-800 dark:hover:bg-slate-950"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
