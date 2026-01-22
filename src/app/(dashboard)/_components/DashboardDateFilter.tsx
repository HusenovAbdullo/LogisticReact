// src/app/(dashboard)/_components/DashboardDateFilter.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { FloatingPanel } from "@/components/dashboard/topbar/FloatingPanel";
import { CalendarPanel } from "@/features/calendar/CalendarPanel";
import { IconCalendar } from "@/shared/ui/icons";

import { formatDMY } from "@/features/calendar/uzCalendar";

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function toISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isoToday() {
  return toISO(new Date());
}

function parseISODate(iso: string): Date | null {
  // iso: YYYY-MM-DD
  const [y, m, d] = String(iso || "").split("-").map((x) => Number(x));
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d);
  return Number.isFinite(dt.getTime()) ? dt : null;
}

export function DashboardDateFilter({
  initialISO,
  className,
}: {
  initialISO: string;
  className?: string;
}) {
  const router = useRouter();
  const sp = useSearchParams();

  const [open, setOpen] = useState(false);

  // tanlangan sana: avval URL dan, bo‘lmasa initialISO
  const urlISO = sp.get("date") ?? "";
  const baseISO = urlISO || initialISO || isoToday();

  const [pickedISO, setPickedISO] = useState<string>(baseISO);

  // URL o‘zgarsa state ham sinx bo‘lsin
  useEffect(() => {
    const next = (sp.get("date") ?? "") || initialISO || isoToday();
    setPickedISO(next);
  }, [sp, initialISO]);

  const pickedDate = useMemo(() => parseISODate(pickedISO) ?? new Date(), [pickedISO]);
  const labelText = useMemo(() => formatDMY(pickedISO), [pickedISO]);

  const rootRef = useRef<HTMLDivElement | null>(null);

  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((v) => !v), []);

  // outside click + esc
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) close();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [close]);

  function apply() {
    const next = pickedISO || isoToday();
    router.push(`?date=${encodeURIComponent(next)}`);
    setOpen(false);
  }

  return (
    <div
      ref={rootRef}
      className={cn(
        "w-full rounded-[28px] bg-white/90 p-3 shadow-[0_8px_30px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/70 backdrop-blur dark:bg-slate-900/70 dark:ring-slate-800",
        className,
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Sana tanlang
          </div>

          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
            {/* pill input */}
            <div className="relative">
              <button
                type="button"
                onClick={toggle}
                aria-haspopup="dialog"
                aria-expanded={open}
                className="flex h-12 w-full min-w-[280px] items-center justify-between gap-3 rounded-full border border-slate-200 bg-slate-50/60 px-4 text-left text-sm font-semibold text-slate-900 outline-none transition hover:bg-white focus:ring-2 focus:ring-blue-500/30 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-100 dark:hover:bg-slate-950"
              >
                <span className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-blue-600 text-white">
                    <IconCalendar className="h-4 w-4" />
                  </span>
                  <span>{labelText}</span>
                </span>

                <span className="grid h-9 w-9 place-items-center rounded-full bg-white ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
                  <IconCalendar className="h-4 w-4 text-slate-700 dark:text-slate-200" />
                </span>
              </button>

              {open && (
                <div className="relative">
                  <FloatingPanel align="left">
                    {/* CalendarPanel ichida tanlash bo‘lsa, uni tanlanganda pickedISO ga yozib qo'yamiz */}
                    <CalendarBridge
                      value={pickedDate}
                      onChange={(d) => setPickedISO(toISO(d))}
                    />
                  </FloatingPanel>
                </div>
              )}
            </div>

            {/* Apply */}
            <button
              type="button"
              onClick={apply}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <span className="h-2.5 w-2.5 rounded-full bg-white/90" />
              Qo‘llash
            </button>
          </div>

          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Tanlangan sana: <b className="text-slate-900 dark:text-slate-100">{pickedISO}</b>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * CalendarPanel sizda tayyor.
 * Lekin u “onPick” callback bermasa, ko‘prik kerak bo‘ladi.
 *
 * Agar CalendarPanel allaqachon store / context orqali date qaytarsa —
 * bu bridge’ni moslab yuboramiz.
 *
 * Quyidagi bridge universal: minimal custom calendar wrapper.
 * Agar CalendarPanel’da “onPick” props bo‘lsa — shu yerda bog‘lab qo‘ying.
 */
function CalendarBridge({
  value,
  onChange,
}: {
  value: Date;
  onChange: (d: Date) => void;
}) {
  // 1) Agar CalendarPanel’da onPick bo‘lsa, shuni ishlating:
  // return <CalendarPanel value={value} onPick={onChange} />

  // 2) Agar hozircha API noma’lum bo‘lsa: CalendarPanel’ni o‘zi chiqsin (UI uchun),
  // va tanlashni CalendarPanel ichida qanday chiqarishingizga qarab bog‘lab beriladi.
  // Hozircha fallback: CalendarPanel ni render qilamiz.
  // Siz CalendarPanel ichidan tanlangan sanani chiqaradigan hook/store bo‘lsa ayting — ulayman.
  return <CalendarPanel />;
}
