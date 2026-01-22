// src/features/calendar/CalendarPanel.tsx
"use client";

import React, { useEffect, useState } from "react";
import {
  UZ_MONTHS,
  UZ_WEEKDAYS_SHORT,
  buildMonthGrid,
  formatDMY,
  formatLongUz,
  formatWeekdayUz,
  getUzWorkCalendarMeta,
  toISODate,
} from "./uzCalendar";
import { IconCalendar, IconDot } from "@/shared/ui/icons";

/* =========================
 * Small UI
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
      className="grid h-9 w-9 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
    >
      <span className="text-lg leading-none">{children}</span>
    </button>
  );
}

/* =========================
 * Panel
 * ========================= */
export function CalendarPanel() {
  const [now, setNow] = useState(() => new Date());

  // kalendar navigatsiyasi
  const [view, setView] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() }; // m: 0..11
  });

  // tanlangan sana (null bo‘lsa — bugun)
  const [selectedISO, setSelectedISO] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const todayISO = toISODate(now);
  const activeISO = selectedISO ?? todayISO;

  // bayram/dam olish ma’lumotlari
  const meta = getUzWorkCalendarMeta(activeISO);

  // header: 21.01.2026 + soat
  const headerDate = formatDMY(activeISO);
  const headerTime = now.toLocaleTimeString("uz-UZ", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  // calendar grid
  const grid = buildMonthGrid(view.y, view.m);

  const monthTitle = `${UZ_MONTHS[view.m]} ${view.y}`;
  const weekdayShort = UZ_WEEKDAYS_SHORT; // Du..Ya

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

  function goToday() {
    const d = new Date();
    setView({ y: d.getFullYear(), m: d.getMonth() });
    setSelectedISO(null);
  }

  return (
    <div className="w-full overflow-hidden rounded-2xl sm:w-[380px]">
      {/* ===== Header ===== */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-600 p-4 text-white">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-14 -left-14 h-44 w-44 rounded-full bg-white/10 blur-2xl" />

        <div className="relative flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/25">
            <IconCalendar className="h-6 w-6" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold tracking-wide text-white/90">
              {headerDate}
            </div>
            <div className="mt-0.5 text-xs text-white/85">{headerTime}</div>
          </div>

          <button
            type="button"
            onClick={goToday}
            className="rounded-2xl bg-white/15 px-3 py-2 text-xs font-semibold ring-1 ring-white/20 hover:bg-white/20"
          >
            Bugun
          </button>
        </div>

        {/* Tanlangan kunga qisqa status */}
        <div className="relative mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] ring-1 ring-white/20">
            {formatWeekdayUz(activeISO)}
          </span>

          {meta.isHoliday && (
            <span className="rounded-full bg-red-500/20 px-2.5 py-1 text-[11px] ring-1 ring-red-200/20">
              Bayram: {meta.label}
            </span>
          )}

          {!meta.isHoliday && meta.isWeekend && (
            <span className="rounded-full bg-amber-500/20 px-2.5 py-1 text-[11px] ring-1 ring-amber-200/20">
              Dam olish: {meta.label}
            </span>
          )}

          {!meta.isHoliday && !meta.isWeekend && meta.isExtraDayOff && (
            <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-[11px] ring-1 ring-emerald-200/20">
              Qo‘shimcha dam olish: {meta.label}
            </span>
          )}
        </div>
      </div>

      {/* ===== Body ===== */}
      <div className="bg-white p-4 ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800">
        {/* Month header */}
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {monthTitle}
          </div>

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
          {weekdayShort.map((w) => (
            <div
              key={w}
              className="px-1 py-1 text-center text-[11px] font-semibold text-slate-400"
            >
              {w}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="mt-1 grid grid-cols-7 gap-1">
          {grid.map((cell, idx) => {
            if (!cell) return <div key={idx} className="h-9" />;

            const iso = cell.iso;
            const d = cell.day;
            const isToday = iso === todayISO;
            const isActive = iso === activeISO;

            const m = getUzWorkCalendarMeta(iso);

            const base =
              "h-9 rounded-xl text-sm font-semibold transition grid place-items-center";
            const ring = isActive
              ? "bg-blue-600 text-white shadow-[0_10px_20px_rgba(37,99,235,0.25)]"
              : "bg-white text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800";

            const mark = m.isHoliday
              ? "ring-1 ring-red-200 dark:ring-red-500/30"
              : m.isWeekend
                ? "ring-1 ring-amber-200 dark:ring-amber-500/30"
                : m.isExtraDayOff
                  ? "ring-1 ring-emerald-200 dark:ring-emerald-500/30"
                  : "ring-1 ring-slate-200 dark:ring-slate-800";

            const todayDot = isToday && !isActive ? "relative" : "";

            return (
              <button
                type="button"
                key={iso}
                onClick={() => setSelectedISO(iso)}
                className={[base, ring, mark, todayDot].join(" ")}
                title={m.label ? m.label : " "}
              >
                {d}
                {isToday && !isActive ? (
                  <span className="absolute -bottom-0.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-blue-600" />
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Detail */}
        <div className="mt-4 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200 dark:bg-slate-950/40 dark:ring-slate-800">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-2xl bg-white ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
              <IconDot className="h-5 w-5 text-slate-500 dark:text-slate-300" />
            </div>

            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                {formatLongUz(activeISO)}
              </div>

              <div className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                {meta.label ? meta.label : "Oddiy ish kuni"}
              </div>

              {(meta.isHoliday || meta.isExtraDayOff) && meta.sourceNote ? (
                <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  {meta.sourceNote}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
