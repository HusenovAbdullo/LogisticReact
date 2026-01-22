// src/app/(dashboard)/page.tsx
import React from "react";
import { serverFetchInternal } from "@/shared/api/http";
import { DatePillPicker } from "../_components/DatePillPicker";

export const dynamic = "force-dynamic";

type TodayStats = {
  date: string;
  delivered: number;
  processing: number;
  cancelled: number;
  postponed: number;
  total: number;
};

function isoToday() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function num(n: unknown) {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

function pct(part: number, total: number) {
  if (!total) return 0;
  return clamp(Math.round((part / total) * 100));
}

function formatInt(n: number) {
  return new Intl.NumberFormat("uz-UZ").format(n);
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ date?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const date = sp.date ?? isoToday();

  let stats: TodayStats | null = null;
  let errorText: string | null = null;

  try {
    stats = await serverFetchInternal<TodayStats>(
      `/api/buyer/today-stats?date=${encodeURIComponent(date)}`,
      { method: "GET", auth: true },
    );
  } catch (e: any) {
    errorText = e?.message ?? "Noma’lum xatolik";
  }

  const s: TodayStats = stats
    ? {
        date: stats.date || date,
        delivered: num(stats.delivered),
        processing: num(stats.processing),
        cancelled: num(stats.cancelled),
        postponed: num(stats.postponed),
        total: num(stats.total),
      }
    : { date, delivered: 0, processing: 0, cancelled: 0, postponed: 0, total: 0 };

  const totalSafe = s.total || 1;

  const deliveredPct = pct(s.delivered, totalSafe);
  const processingPct = pct(s.processing, totalSafe);
  const postponedPct = pct(s.postponed, totalSafe);
  const cancelledPct = pct(s.cancelled, totalSafe);

  // donut segments
  const a = deliveredPct;
  const b = deliveredPct + processingPct;
  const c = deliveredPct + processingPct + postponedPct;

  const donutStyle = {
    background: `conic-gradient(
      rgb(34 197 94) 0 ${a}%,
      rgb(59 130 246) ${a}% ${b}%,
      rgb(245 158 11) ${b}% ${c}%,
      rgb(239 68 68) ${c}% 100%
    )`,
  } as const;

  const max = Math.max(s.delivered, s.processing, s.postponed, s.cancelled, 1);

  return (
    <div className="min-h-[calc(100vh-120px)]">
      {/* background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[#F6F9FF] dark:bg-slate-950" />
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-blue-600/10 blur-3xl dark:bg-blue-500/10" />
        <div className="absolute -bottom-48 -left-28 h-[520px] w-[520px] rounded-full bg-indigo-500/10 blur-3xl dark:bg-indigo-500/10" />
      </div>

      <div className="space-y-4">
        {/* Header row: Title + DATE PILL (2-rasm) */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
              Dashboard
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-300">
              Bugungi statistika va KPI
            </div>
          </div>

          {/* Faqat pill: bosilganda kalendar ochiladi, kun bosilsa srazi yangilanadi */}
          <DatePillPicker initialISO={date} />
        </div>

        {errorText ? (
          <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-[0_8px_30px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/40 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200 dark:ring-slate-800">
            <div className="font-extrabold">API xatoligi</div>
            <div className="mt-1 break-words opacity-95">{errorText}</div>
          </div>
        ) : null}

        {/* KPI grid */}
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard title="Jami buyurtmalar" value={formatInt(s.total)} meta={`Sana: ${s.date}`} tone="neutral" />
          <KpiCard title="Yetkazilgan" value={formatInt(s.delivered)} meta={`${deliveredPct}%`} tone="success" />
          <KpiCard title="Jarayonda" value={formatInt(s.processing)} meta={`${processingPct}%`} tone="info" />
          <KpiCard title="Bekor qilingan" value={formatInt(s.cancelled)} meta={`${cancelledPct}%`} tone="danger" />
        </section>

        {/* Charts */}
        <section className="grid grid-cols-1 gap-3 xl:grid-cols-[1.05fr_0.95fr]">
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  Holatlar taqsimoti
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Yetkazilgan / Jarayonda / Kechiktirilgan / Bekor qilingan
                </p>
              </div>
              <Pill>
                Jami: <b className="text-slate-900 dark:text-slate-100">{formatInt(s.total)}</b>
              </Pill>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr] lg:items-center">
              <div className="mx-auto w-full max-w-[260px]">
                <div className="rounded-[28px] bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-slate-950/40 dark:ring-slate-800">
                  <div className="mx-auto grid place-items-center">
                    <div className="relative h-48 w-48 rounded-full" style={donutStyle}>
                      <div className="absolute inset-[14px] rounded-full bg-white shadow-sm dark:bg-slate-900" />
                      <div className="absolute inset-0 grid place-items-center">
                        <div className="text-center">
                          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            Jami
                          </div>
                          <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                            {formatInt(s.total)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <LegendRow label="Yetkazilgan" value={formatInt(s.delivered)} percent={deliveredPct} dotClass="bg-green-500" />
                <LegendRow label="Jarayonda" value={formatInt(s.processing)} percent={processingPct} dotClass="bg-blue-500" />
                <LegendRow label="Kechiktirilgan" value={formatInt(s.postponed)} percent={postponedPct} dotClass="bg-amber-500" />
                <LegendRow label="Bekor qilingan" value={formatInt(s.cancelled)} percent={cancelledPct} dotClass="bg-red-500" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  Bar indikatorlar
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Eng katta qiymatga nisbatan (0–100%)
                </p>
              </div>
              <Pill>
                Maks: <b className="text-slate-900 dark:text-slate-100">{formatInt(max)}</b>
              </Pill>
            </div>

            <div className="mt-5 space-y-4">
              <BarRow label="Yetkazilgan" value={s.delivered} max={max} tone="success" />
              <BarRow label="Jarayonda" value={s.processing} max={max} tone="info" />
              <BarRow label="Kechiktirilgan" value={s.postponed} max={max} tone="warning" />
              <BarRow label="Bekor qilingan" value={s.cancelled} max={max} tone="danger" />
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}

/* =========================
 * UI primitives (page local)
 * ========================= */

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[28px] bg-white/90 p-4 shadow-[0_8px_30px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/70 backdrop-blur dark:bg-slate-900/70 dark:ring-slate-800 sm:p-5">
      {children}
    </div>
  );
}

function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 dark:bg-slate-950/40 dark:text-slate-200 dark:ring-slate-800",
        className,
      )}
    >
      {children}
    </span>
  );
}

function KpiCard({
  title,
  value,
  meta,
  tone,
}: {
  title: string;
  value: string;
  meta?: string;
  tone: "neutral" | "success" | "info" | "warning" | "danger";
}) {
  const toneRing =
    tone === "success"
      ? "ring-green-200 dark:ring-green-900/40"
      : tone === "info"
        ? "ring-blue-200 dark:ring-blue-900/40"
        : tone === "warning"
          ? "ring-amber-200 dark:ring-amber-900/40"
          : tone === "danger"
            ? "ring-red-200 dark:ring-red-900/40"
            : "ring-slate-200/70 dark:ring-slate-800";

  const badge =
    tone === "success"
      ? "bg-green-50 text-green-700 ring-green-200 dark:bg-green-950/30 dark:text-green-200 dark:ring-green-900/50"
      : tone === "info"
        ? "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950/30 dark:text-blue-200 dark:ring-blue-900/50"
        : tone === "warning"
          ? "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-200 dark:ring-amber-900/50"
          : tone === "danger"
            ? "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/30 dark:text-red-200 dark:ring-red-900/50"
            : "bg-slate-50 text-slate-700 ring-slate-200 dark:bg-slate-950/40 dark:text-slate-200 dark:ring-slate-800";

  return (
    <div
      className={cn(
        "rounded-[28px] bg-white/90 p-4 shadow-[0_8px_30px_rgba(15,23,42,0.06)] ring-1 backdrop-blur dark:bg-slate-900/70 sm:p-5",
        toneRing,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs font-extrabold tracking-wide text-slate-500 dark:text-slate-400">
          {title}
        </div>
        {meta ? (
          <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1", badge)}>
            {meta}
          </span>
        ) : null}
      </div>

      <div className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
        {value}
      </div>
      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {/* Yangilash: SSR render */}
      </div>
    </div>
  );
}

function LegendRow({
  label,
  value,
  percent,
  dotClass,
}: {
  label: string;
  value: string;
  percent: number;
  dotClass: string;
}) {
  return (
    <div className="rounded-[22px] bg-slate-50 px-4 py-3 ring-1 ring-slate-200 dark:bg-slate-950/40 dark:ring-slate-800">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className={cn("h-3 w-3 shrink-0 rounded-full", dotClass)} />
          <div className="truncate font-semibold text-slate-900 dark:text-slate-100">{label}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{value}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">({percent}%)</div>
        </div>
      </div>

      <div className="mt-3 h-2.5 rounded-full bg-white ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <div className={cn("h-2.5 rounded-full", dotClass)} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function BarRow({
  label,
  value,
  max,
  tone,
}: {
  label: string;
  value: number;
  max: number;
  tone: "success" | "info" | "warning" | "danger";
}) {
  const w = clamp(Math.round((value / max) * 100));
  const bar =
    tone === "success"
      ? "bg-green-500"
      : tone === "info"
        ? "bg-blue-500"
        : tone === "warning"
          ? "bg-amber-500"
          : "bg-red-500";

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{label}</div>
        <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
          {formatInt(value)}
        </div>
      </div>

      <div className="mt-2 h-3 rounded-full bg-slate-100 ring-1 ring-slate-200 dark:bg-slate-950/40 dark:ring-slate-800">
        <div className={cn("h-3 rounded-full", bar)} style={{ width: `${w}%` }} />
      </div>

      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{w}%</div>
    </div>
  );
}
