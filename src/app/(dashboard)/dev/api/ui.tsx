"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import SwaggerPanel from "./SwaggerPanel";

type LogItem = {
  id: string;
  ts: string;
  direction: "outgoing" | "incoming";
  method: string;
  url: string;
  status?: number;
  duration_ms?: number;
  error?: string;
};

type SpecMode = "full" | "logs-all" | "logs-backend" | "logs-internal";
type TabKey = "swagger" | "logs";

/* =========================
 * Utils
 * ========================= */
function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function useDebounced<T>(value: T, delayMs = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

function fmtTime(ts: string) {
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? ts : d.toLocaleString("uz-UZ");
}

function statusTone(status?: number) {
  if (!status && status !== 0) return "muted";
  if (status >= 200 && status < 300) return "ok";
  if (status >= 300 && status < 400) return "warn";
  return "bad";
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

/* =========================
 * UI Primitives
 * ========================= */
function Pill({
  tone,
  children,
}: {
  tone: "muted" | "ok" | "warn" | "bad";
  children: React.ReactNode;
}) {
  const cls =
    tone === "ok"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : tone === "warn"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : tone === "bad"
          ? "bg-rose-50 text-rose-700 border-rose-200"
          : "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", cls)}>
      {children}
    </span>
  );
}

function SegmentedTabs({
  value,
  onChange,
  items,
}: {
  value: string;
  onChange: (v: string) => void;
  items: Array<{ key: string; label: string }>;
}) {
  return (
    <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
      {items.map((it) => {
        const active = it.key === value;
        return (
          <button
            key={it.key}
            type="button"
            onClick={() => onChange(it.key)}
            className={cn(
              "h-10 px-4 rounded-lg text-sm font-semibold transition",
              active ? "bg-slate-900 text-white shadow" : "text-slate-700 hover:bg-slate-50",
            )}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

function Select({
  value,
  onChange,
  children,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  ariaLabel?: string;
}) {
  return (
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none",
        "focus:border-slate-300 focus:ring-2 focus:ring-slate-200",
      )}
    >
      {children}
    </select>
  );
}

function Button({
  children,
  onClick,
  disabled,
  variant = "secondary",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost";
}) {
  const cls =
    variant === "primary"
      ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700"
      : variant === "ghost"
        ? "bg-transparent border-transparent text-slate-700 hover:bg-slate-50"
        : "bg-white border-slate-200 text-slate-900 hover:bg-slate-50";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "h-11 rounded-xl border px-4 text-sm font-semibold shadow-sm transition",
        cls,
        disabled && "opacity-50 cursor-not-allowed hover:bg-white",
      )}
    >
      {children}
    </button>
  );
}

function LiveToggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={cn(
        "h-11 px-4 rounded-xl border shadow-sm text-sm font-semibold transition flex items-center gap-2",
        value ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-white border-slate-200 text-slate-900 hover:bg-slate-50",
      )}
      aria-pressed={value}
      title="Real vaqtda yangilash"
    >
      <span className={cn("inline-block h-2.5 w-2.5 rounded-full", value ? "bg-emerald-500" : "bg-slate-400")} />
      Jonli
    </button>
  );
}

function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-slate-200 bg-white shadow-sm", className)}>
      {children}
    </div>
  );
}

/* =========================
 * Main Component
 * ========================= */
export default function ApiConsole() {
  const [tab, setTab] = useState<TabKey>("swagger");
  const [specMode, setSpecMode] = useState<SpecMode>("full");

  const pageSize = 50;
  const [page, setPage] = useState(1);

  // “yoziladigan emas — tanlanadigan” filtrlari
  const [filterPreset, setFilterPreset] = useState<
    "all" | "muammo" | "401" | "4xx" | "5xx" | "2xx" | "backend" | "internal"
  >("all");
  const [method, setMethod] = useState<string>(""); // GET/POST/...
  const [status, setStatus] = useState<string>(""); // 200-299 / 401 / 500-599
  const [direction, setDirection] = useState<string>(""); // incoming/outgoing
  const [urlPick, setUrlPick] = useState<string>(""); // tez tanlash

  // Jonli rejim
  const [live, setLive] = useState(true);
  const [intervalMs, setIntervalMs] = useState(2000);
  const [pauseOnHover, setPauseOnHover] = useState(true);
  const [isHoveringTable, setIsHoveringTable] = useState(false);

  const dPreset = useDebounced(filterPreset);
  const dMethod = useDebounced(method);
  const dStatus = useDebounced(status);
  const dDir = useDebounced(direction);
  const dUrl = useDebounced(urlPick);

  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // UI uchun dinamik “URL tez tanlash” ro‘yxati (oxirgi kelgan loglardan)
  const [urlOptions, setUrlOptions] = useState<Array<{ value: string; label: string }>>([]);

  const pages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total]);

  // Preset → query param mapping
  const presetToQuery = useMemo(() => {
    // /api/logs endpoint’i: q, method, status, direction
    // q ni “tez filtr” sifatida ishlatamiz (url/error bo‘yicha ham qidirish uchun server tomonda allaqachon bor)
    const qParts: string[] = [];

    let statusValue = dStatus;
    let directionValue = dDir;
    let methodValue = dMethod;

    // preset status override
    if (dPreset === "2xx") statusValue = "200-299";
    if (dPreset === "401") statusValue = "401";
    if (dPreset === "4xx") statusValue = "400-499";
    if (dPreset === "5xx") statusValue = "500-599";

    // preset “yo‘nalish”
    if (dPreset === "backend") qParts.push("backend");
    if (dPreset === "internal") qParts.push("/api/");

    // preset “muammo”
    if (dPreset === "muammo") qParts.push("error");

    // URL tez tanlash
    if (dUrl) qParts.push(dUrl);

    const qValue = qParts.filter(Boolean).join(" ");

    return {
      q: qValue,
      method: methodValue,
      status: statusValue,
      direction: directionValue,
    };
  }, [dPreset, dMethod, dStatus, dDir, dUrl]);

  const query = useMemo(() => {
    const sp = new URLSearchParams();
    if (presetToQuery.q) sp.set("q", presetToQuery.q);
    if (presetToQuery.method) sp.set("method", presetToQuery.method);
    if (presetToQuery.status) sp.set("status", presetToQuery.status);
    if (presetToQuery.direction) sp.set("direction", presetToQuery.direction);
    sp.set("page", String(page));
    sp.set("pageSize", String(pageSize));
    return sp.toString();
  }, [presetToQuery, page]);

  const specUrl = useMemo(() => {
    if (specMode === "full") return "/openapi.full.json";
    if (specMode === "logs-backend") return "/openapi.json?scope=backend";
    if (specMode === "logs-internal") return "/openapi.json?scope=internal";
    return "/openapi.json?scope=all";
  }, [specMode]);

  // overlap guard
  const inflightRef = useRef(false);

  async function loadLogs() {
    if (inflightRef.current) return;
    inflightRef.current = true;

    setLoading(true);
    setErrMsg(null);

    try {
      const res = await fetch(`/api/logs?${query}`, { cache: "no-store" });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        const msg = data?.error || data?.message || `So‘rov bajarilmadi: ${res.status}`;
        setErrMsg(String(msg));
        setItems([]);
        setTotal(0);
        return;
      }

      const newItems: LogItem[] = Array.isArray(data.items) ? data.items : [];
      setTotal(Number(data.total) || 0);
      setItems(newItems);

      // URL options (tez tanlash) — mavjud loglardan qisqa ro‘yxat
      const uniq = new Map<string, number>();
      for (const it of newItems) {
        const u = String(it.url || "").trim();
        if (!u) continue;
        uniq.set(u, (uniq.get(u) || 0) + 1);
      }

      const sorted = Array.from(uniq.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([value, count]) => ({
          value,
          label: `${value.length > 70 ? value.slice(0, 70) + "…" : value} (${count})`,
        }));

      setUrlOptions(sorted);
    } catch (e: any) {
      setErrMsg(e?.message || "Tarmoq xatosi");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
      inflightRef.current = false;
    }
  }

  async function exportJson() {
    try {
      const res = await fetch(`/api/logs/export?${query}`, { cache: "no-store" });
      const data = await res.json().catch(() => null);
      if (data?.ok && data.downloadUrl) window.location.href = data.downloadUrl;
      else alert(data?.error || "Eksport bajarilmadi");
    } catch {
      alert("Eksport bajarilmadi");
    }
  }

  // initial and query change
  useEffect(() => {
    if (tab === "logs") loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, query]);

  // page reset on filters change
  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dPreset, dMethod, dStatus, dDir, dUrl]);

  // Live polling
  useEffect(() => {
    if (tab !== "logs") return;
    if (!live) return;
    if (document.visibilityState !== "visible") return;
    if (pauseOnHover && isHoveringTable) return;

    const t = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      if (pauseOnHover && isHoveringTable) return;
      loadLogs();
    }, intervalMs);

    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, live, intervalMs, query, pauseOnHover, isHoveringTable]);

  // visibility change: refresh once
  useEffect(() => {
    if (tab !== "logs") return;
    const onVis = () => {
      if (document.visibilityState === "visible" && live) loadLogs();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, live, query]);

  // “3-rasmga o‘xshash” yuqori blok
  const headerBadges = (
    <div className="flex flex-wrap items-center gap-2">
      <Pill tone="muted">Bo‘lim: API Konsol</Pill>
      <Pill tone="ok">Rejim: {tab === "logs" ? "Jonli Loglar" : "Swagger"}</Pill>
      <Pill tone="muted">Sahifa: {page} / {pages}</Pill>
      <Pill tone="muted">Jami: {total}</Pill>
    </div>
  );

  const topAlert = errMsg ? (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
      <div className="font-bold">API xatoligi</div>
      <div className="text-sm mt-1">{errMsg}</div>
      <div className="text-xs mt-2 text-amber-800">
        Tekshiruv: cookie/token (AUTH_COOKIE) mavjudligi va tegishli route ishlashi.
      </div>
    </div>
  ) : null;

  return (
    <div className="p-4 md:p-6">
      {/* Background “panel” (3-rasm uslubida yumshoq gradient) */}
      <div className="rounded-[28px] bg-gradient-to-b from-slate-50 to-white border border-slate-200 p-4 md:p-6 shadow-sm">
        {/* Hero */}
        <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-5 md:p-6">
          <div className="flex flex-col lg:flex-row lg:items-start gap-4">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-blue-600" />
                <span className="text-sm font-semibold text-slate-600">Boshqaruv paneli</span>
              </div>

              <h1 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
                API Konsol
              </h1>

              <p className="mt-2 text-sm md:text-base text-slate-600 leading-relaxed max-w-2xl">
                Swagger hujjatlari va so‘rov loglarini bitta joyda boshqaring. Loglar serverdan keladi, jonli rejimda yangilanadi,
                va filtrlash tanlash orqali amalga oshiriladi.
              </p>

              <div className="mt-4">{headerBadges}</div>
            </div>

            {/* O‘ng tomonda “amal” blok (3-rasmdagi sana tanlash uslubida) */}
            <div className="w-full lg:w-[420px]">
              <Card className="p-4 md:p-5">
                <div className="text-sm font-bold text-slate-900">Tezkor boshqaruv</div>
                <div className="text-xs text-slate-500 mt-1">
                  Filtrlar, jonli rejim va eksport shu yerdan.
                </div>

                <div className="mt-4 grid grid-cols-1 gap-2">
                  {tab === "logs" ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <LiveToggle value={live} onChange={setLive} />
                        <Select
                          ariaLabel="Yangilanish oralig‘i"
                          value={String(intervalMs)}
                          onChange={(v) => setIntervalMs(clamp(Number(v), 500, 60000))}
                        >
                          <option value="1000">Har 1 soniyada</option>
                          <option value="2000">Har 2 soniyada</option>
                          <option value="3000">Har 3 soniyada</option>
                          <option value="5000">Har 5 soniyada</option>
                          <option value="10000">Har 10 soniyada</option>
                        </Select>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => setPauseOnHover((v) => !v)}
                        >
                          {pauseOnHover ? "Hoverda pauza: YOQISH" : "Hoverda pauza: O‘CHIRISH"}
                        </Button>
                        <Button variant="primary" onClick={loadLogs} disabled={loading}>
                          {loading ? "Yuklanmoqda..." : "Yangilash"}
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <Button onClick={exportJson}>JSON eksport</Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            // tez reset
                            setFilterPreset("all");
                            setMethod("");
                            setStatus("");
                            setDirection("");
                            setUrlPick("");
                            setPage(1);
                          }}
                        >
                          Filtrlarni tozalash
                        </Button>
                      </div>

                      <div className="text-xs text-slate-500">
                        Holat: {live ? `Jonli — ${intervalMs / 1000}s` : "Jonli o‘chiq"}
                        {pauseOnHover ? " (hover = pauza)" : ""}
                      </div>
                    </>
                  ) : (
                    <>
                      <Button variant="primary" onClick={() => window.open(specUrl, "_blank")}>
                        Swagger JSON ni ochish
                      </Button>
                      <div className="text-xs text-slate-500">
                        Spec manzili: <span className="font-mono">{specUrl}</span>
                      </div>
                    </>
                  )}
                </div>
              </Card>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-5 flex flex-col md:flex-row md:items-center gap-3">
            <SegmentedTabs
              value={tab}
              onChange={(v) => setTab(v as TabKey)}
              items={[
                { key: "swagger", label: "Swagger hujjati" },
                { key: "logs", label: "So‘rov loglari" },
              ]}
            />

            <div className="md:ml-auto text-xs text-slate-500">
              {tab === "logs" ? (
                <>
                  Jami: <span className="font-semibold text-slate-900">{total}</span> • Sahifa{" "}
                  <span className="font-semibold text-slate-900">{page}</span> / {pages}
                </>
              ) : (
                "Logistika API hujjatlari"
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-4">
          {topAlert}

          {tab === "swagger" && (
            <Card>
              <div className="p-4 md:p-5 border-b border-slate-200">
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                  <div>
                    <div className="text-lg font-extrabold text-slate-900">Swagger hujjatlari</div>
                    <div className="text-sm text-slate-600 mt-1">
                      Spec tanlang va API endpointlarni ko‘rib chiqing.
                    </div>
                  </div>

                  <div className="md:ml-auto w-full md:w-[380px]">
                    <Select
                      ariaLabel="Spec tanlash"
                      value={specMode}
                      onChange={(v) => setSpecMode(v as SpecMode)}
                    >
                      <option value="full">To‘liq (koddan) — barcha API</option>
                      <option value="logs-all">Loglar (hammasi)</option>
                      <option value="logs-backend">Loglar (faqat backend)</option>
                      <option value="logs-internal">Loglar (faqat internal)</option>
                    </Select>
                  </div>
                </div>
              </div>

              {/* “Swaggerham o‘zgacha” — ramka + yumshoq fon */}
              <div className="p-3 md:p-5">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white">
                    <div className="text-sm font-bold text-slate-900">Hujjat paneli</div>
                    <a
                      className="text-sm font-semibold text-blue-700 hover:text-blue-800 underline underline-offset-2"
                      href={specUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      JSON ni ochish
                    </a>
                  </div>

                  <div className="bg-white">
                    <SwaggerPanel specUrl={specUrl} />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {tab === "logs" && (
            <Card>
              {/* Filters (tanlanadigan) */}
              <div className="p-4 md:p-5 border-b border-slate-200">
                <div className="text-lg font-extrabold text-slate-900">So‘rov loglari</div>
                <div className="text-sm text-slate-600 mt-1">
                  Filtrlarni tanlang. Matn yozib qidirish o‘rniga preset va ro‘yxatlardan foydalaniladi.
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-2">
                  <div className="md:col-span-3">
                    <Select
                      ariaLabel="Tez filtr"
                      value={filterPreset}
                      onChange={(v) => setFilterPreset(v as any)}
                    >
                      <option value="all">Tez filtr: Hammasi</option>
                      <option value="muammo">Tez filtr: Muammolar (error)</option>
                      <option value="2xx">Tez filtr: Muvaffaqiyatli (2xx)</option>
                      <option value="401">Tez filtr: 401 (Auth)</option>
                      <option value="4xx">Tez filtr: 4xx (Client)</option>
                      <option value="5xx">Tez filtr: 5xx (Server)</option>
                      <option value="backend">Tez filtr: Backend</option>
                      <option value="internal">Tez filtr: Internal (/api)</option>
                    </Select>
                  </div>

                  <div className="md:col-span-2">
                    <Select ariaLabel="Method" value={method} onChange={setMethod}>
                      <option value="">Method: Hammasi</option>
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="PATCH">PATCH</option>
                      <option value="DELETE">DELETE</option>
                    </Select>
                  </div>

                  <div className="md:col-span-3">
                    <Select ariaLabel="Status" value={status} onChange={setStatus}>
                      <option value="">Status: Hammasi</option>
                      <option value="200-299">200–299</option>
                      <option value="300-399">300–399</option>
                      <option value="400-499">400–499</option>
                      <option value="401">401</option>
                      <option value="403">403</option>
                      <option value="404">404</option>
                      <option value="500-599">500–599</option>
                    </Select>
                  </div>

                  <div className="md:col-span-2">
                    <Select ariaLabel="Yo‘nalish" value={direction} onChange={setDirection}>
                      <option value="">Yo‘nalish: Hammasi</option>
                      <option value="incoming">Kirish (incoming)</option>
                      <option value="outgoing">Chiqish (outgoing)</option>
                    </Select>
                  </div>

                  <div className="md:col-span-2">
                    <Select
                      ariaLabel="URL tez tanlash"
                      value={urlPick}
                      onChange={setUrlPick}
                    >
                      <option value="">URL: Hammasi</option>
                      {urlOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                {/* Small stats row */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Pill tone={live ? "ok" : "muted"}>{live ? `Jonli: ${intervalMs / 1000}s` : "Jonli: o‘chiq"}</Pill>
                  <Pill tone="muted">Sahifa: {page} / {pages}</Pill>
                  <Pill tone="muted">Jami yozuvlar: {total}</Pill>
                  {loading && <Pill tone="warn">Yuklanmoqda…</Pill>}
                </div>
              </div>

              {/* Table */}
              <div className="p-3 md:p-5">
                <div
                  className="rounded-2xl border border-slate-200 overflow-x-auto bg-white"
                  onMouseEnter={() => setIsHoveringTable(true)}
                  onMouseLeave={() => setIsHoveringTable(false)}
                >
                  <table className="min-w-[1100px] w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                        <th className="text-left p-3 font-bold">Vaqt</th>
                        <th className="text-left p-3 font-bold">Yo‘nalish</th>
                        <th className="text-left p-3 font-bold">Method</th>
                        <th className="text-left p-3 font-bold">Manzil (URL)</th>
                        <th className="text-left p-3 font-bold">Status</th>
                        <th className="text-left p-3 font-bold">Davomiylik</th>
                        <th className="text-left p-3 font-bold">Xatolik</th>
                      </tr>
                    </thead>

                    <tbody>
                      {items.length === 0 && !loading && !errMsg && (
                        <tr>
                          <td className="p-5 text-slate-500" colSpan={7}>
                            Loglar topilmadi. Filtrlarni o‘zgartirib ko‘ring.
                          </td>
                        </tr>
                      )}

                      {items.map((x) => {
                        const tone = statusTone(x.status);
                        return (
                          <tr key={x.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60 transition">
                            <td className="p-3 whitespace-nowrap text-slate-700">{fmtTime(x.ts)}</td>

                            <td className="p-3">
                              <Pill tone={x.direction === "incoming" ? "ok" : "muted"}>
                                {x.direction === "incoming" ? "kirish" : "chiqish"}
                              </Pill>
                            </td>

                            <td className="p-3">
                              <Pill tone="muted">{x.method}</Pill>
                            </td>

                            <td className="p-3">
                              <div className="max-w-[640px] truncate text-slate-900">{x.url}</div>
                            </td>

                            <td className="p-3">
                              <Pill tone={tone}>{x.status ?? "-"}</Pill>
                            </td>

                            <td className="p-3 text-slate-700">{x.duration_ms ?? "-"}</td>

                            <td className="p-3">
                              <div className="max-w-[360px] truncate text-slate-700">{x.error ?? ""}</div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="mt-4 flex flex-col md:flex-row md:items-center gap-2">
                  <div className="text-sm text-slate-600">
                    Jami: <span className="font-bold text-slate-900">{total}</span> • Sahifa:{" "}
                    <span className="font-bold text-slate-900">{page}</span> / {pages}
                  </div>

                  <div className="md:ml-auto flex items-center gap-2">
                    <Button
                      disabled={page <= 1 || loading}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Oldingi
                    </Button>
                    <Button
                      disabled={page >= pages || loading}
                      onClick={() => setPage((p) => Math.min(pages, p + 1))}
                    >
                      Keyingi
                    </Button>
                  </div>
                </div>

                <div className="mt-2 text-xs text-slate-500">
                  Eslatma: Jonli rejimda jadval ustiga kursor olib borilsa {pauseOnHover ? "yangilanish pauza bo‘ladi." : "yangilanish to‘xtamaydi."}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
