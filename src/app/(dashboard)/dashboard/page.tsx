// src/app/(dashboard)/page.tsx
import React from "react";
import { serverFetchInternal } from "@/shared/api/http";

export const dynamic = "force-dynamic";

type TodayStats = {
  date: string; // "2026-01-17"
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

function toDMY(iso: string) {
  const [y, m, d] = String(iso || "").split("-");
  if (!y || !m || !d) return iso;
  return `${d}.${m}.${y}`;
}

function num(n: unknown) {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

function pct(n: number, total: number) {
  if (!total) return 0;
  return clamp(Math.round((n / total) * 100));
}

function formatInt(n: number) {
  return new Intl.NumberFormat("uz-UZ").format(n);
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ date?: string }>;
}) {
  // Next 16: searchParams Promise bo'lishi mumkin
  const sp = (await searchParams) ?? {};
  const date = sp.date ?? isoToday();

  let stats: TodayStats | null = null;
  let errorText: string | null = null;

  try {
    // SSR: faqat Next ichidagi proxy route
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
    : {
        date,
        delivered: 0,
        processing: 0,
        cancelled: 0,
        postponed: 0,
        total: 0,
      };

  const totalSafe = s.total || 1;

  const deliveredPct = pct(s.delivered, totalSafe);
  const processingPct = pct(s.processing, totalSafe);
  const postponedPct = pct(s.postponed, totalSafe);
  const cancelledPct = pct(s.cancelled, totalSafe);

  // Donut segmentlar
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
    <div className="space-y-4">
      {/* =========================
          HERO (zamonaviy)
      ========================= */}
      <section className="relative overflow-hidden rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800 sm:p-6">
        {/* Glow */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-600/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-indigo-600/10 blur-3xl" />

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 dark:bg-slate-950/40 dark:text-slate-200 dark:ring-slate-800">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              Xaridor paneli
            </div>

            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
              Bugungi statistika
            </h1>

            <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
              Buyurtmalar holati, ulushi va indikatorlar. Ma’lumotlar server tomonda olinadi (SSR)
              va backend manzili brauzerda ko‘rinmaydi.
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <Chip>
                Sana:{" "}
                <b className="text-slate-900 dark:text-slate-100">{toDMY(date)}</b>
              </Chip>
              <Chip>
                Rejim:{" "}
                <b className="text-slate-900 dark:text-slate-100">SSR</b>
              </Chip>
              <Chip>
                Xavfsizlik:{" "}
                <b className="text-slate-900 dark:text-slate-100">API/Response yashirin</b>
              </Chip>
            </div>
          </div>

          {/* Filter (GET) */}
          <form
            method="get"
            className="w-full max-w-xl rounded-3xl bg-slate-50 p-3 ring-1 ring-slate-200 dark:bg-slate-950/40 dark:ring-slate-800 sm:flex sm:items-end sm:gap-3"
          >
            <div className="flex-1">
              <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                Sana tanlang
              </label>
              <input
                type="date"
                name="date"
                defaultValue={date}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/25 dark:border-slate-800 dark:bg-slate-900"
              />
            </div>

            <button
              type="submit"
              className="mt-3 h-11 w-full rounded-2xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 sm:mt-0 sm:w-auto"
            >
              Qo‘llash
            </button>
          </form>
        </div>

        {/* Error */}
        {errorText ? (
          <div className="relative mt-4 overflow-hidden rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
            <div className="font-extrabold">API xatoligi</div>
            <div className="mt-1 break-words opacity-95">{errorText}</div>
            <div className="mt-2 text-xs opacity-80">
              Tekshiruv: cookie’da token bormi (AUTH_COOKIE), va{" "}
              <code className="rounded bg-black/5 px-1 py-0.5 dark:bg-white/10">
                /api/buyer/today-stats
              </code>{" "}
              route ishlayaptimi.
            </div>
          </div>
        ) : null}
      </section>

      {/* =========================
          KPI GRID
      ========================= */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          title="Jami buyurtmalar"
          value={formatInt(s.total)}
          meta={toDMY(s.date)}
          tone="neutral"
        />
        <KpiCard
          title="Yetkazilgan"
          value={formatInt(s.delivered)}
          meta={`${deliveredPct}%`}
          tone="success"
        />
        <KpiCard
          title="Jarayonda"
          value={formatInt(s.processing)}
          meta={`${processingPct}%`}
          tone="info"
        />
        <KpiCard
          title="Bekor qilingan"
          value={formatInt(s.cancelled)}
          meta={`${cancelledPct}%`}
          tone="danger"
        />
      </section>

      {/* =========================
          CHARTS
      ========================= */}
      <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {/* Donut */}
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                Holatlar taqsimoti
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Yetkazilgan / Jarayonda / Kechiktirilgan / Bekor qilingan ulushi
              </p>
            </div>

            <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 dark:bg-slate-950/40 dark:text-slate-200 dark:ring-slate-800">
              Jami: {formatInt(s.total)}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-[220px_1fr] sm:items-center">
            <div className="mx-auto grid place-items-center">
              <div className="relative h-44 w-44 rounded-full" style={donutStyle} aria-label="Holatlar taqsimoti">
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

            <div className="space-y-2">
              <LegendRow label="Yetkazilgan" value={formatInt(s.delivered)} percent={deliveredPct} dotClass="bg-green-500" />
              <LegendRow label="Jarayonda" value={formatInt(s.processing)} percent={processingPct} dotClass="bg-blue-500" />
              <LegendRow label="Kechiktirilgan" value={formatInt(s.postponed)} percent={postponedPct} dotClass="bg-amber-500" />
              <LegendRow label="Bekor qilingan" value={formatInt(s.cancelled)} percent={cancelledPct} dotClass="bg-red-500" />
            </div>
          </div>
        </Card>

        {/* Bars */}
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                Bar-grafik
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Eng katta qiymatga nisbatan (0–100%)
              </p>
            </div>

            <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 dark:bg-slate-950/40 dark:text-slate-200 dark:ring-slate-800">
              Maks: {formatInt(max)}
            </span>
          </div>

          <div className="mt-5 space-y-4">
            <BarRow label="Yetkazilgan" value={s.delivered} max={max} tone="success" />
            <BarRow label="Jarayonda" value={s.processing} max={max} tone="info" />
            <BarRow label="Kechiktirilgan" value={s.postponed} max={max} tone="warning" />
            <BarRow label="Bekor qilingan" value={s.cancelled} max={max} tone="danger" />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <MiniKpi label="Yetkazish ulushi" value={`${pct(s.delivered, s.total || 0)}%`} sub="Yetkazilgan / Jami" />
            <MiniKpi label="Muammo ulushi" value={`${pct(s.cancelled, s.total || 0)}%`} sub="Bekor qilingan / Jami" />
          </div>
        </Card>
      </section>

      <footer className="rounded-3xl bg-white p-4 text-xs text-slate-500 shadow-sm ring-1 ring-slate-200/70 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-800">
        Eslatma: Sana almashtirish URL query orqali ishlaydi, sahifa SSR qayta render bo‘ladi. Shu sabab backend chaqirig‘i brauzer Network bo‘limida ko‘rinmaydi.
      </footer>
    </div>
  );
}

/* =========================
 * UI primitives
 * ========================= */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800 sm:p-6">
      {children}
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 dark:bg-slate-950/40 dark:text-slate-300 dark:ring-slate-800">
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

  const toneBadge =
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
    <div className={`rounded-3xl bg-white p-4 shadow-sm ring-1 ${toneRing} dark:bg-slate-900 sm:p-5`}>
      <div className="flex items-start justify-between gap-2">
        <div className="text-[11px] font-extrabold tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </div>
        {meta ? (
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${toneBadge}`}>
            {meta}
          </span>
        ) : null}
      </div>

      <div className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
        {value}
      </div>

      <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        Yangilash: sahifa SSR qayta yuklanadi
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
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200 dark:bg-slate-950/40 dark:ring-slate-800">
      <div className="flex items-center gap-3">
        <span className={`h-3 w-3 rounded-full ${dotClass}`} />
        <div className="font-semibold text-slate-900 dark:text-slate-100">{label}</div>
      </div>
      <div className="text-right">
        <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{value}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400">({percent}%)</div>
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
  const barCls =
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
        <div className={`h-3 rounded-full ${barCls}`} style={{ width: `${w}%` }} />
      </div>

      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{w}%</div>
    </div>
  );
}

function MiniKpi({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-slate-950/40 dark:ring-slate-800">
      <div className="text-[11px] font-extrabold tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-slate-100">{value}</div>
      {sub ? <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{sub}</div> : null}
    </div>
  );
}
