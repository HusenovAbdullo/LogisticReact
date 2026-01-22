// src/features/weather/WeatherPanel.tsx
"use client";

import React, { useState } from "react";
import { useCurrentWeatherDetailed } from "./useCurrentWeatherDetailed";
import { IconCloud } from "@/shared/ui/icons";

/* =========================
 * Small UI
 * ========================= */
function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-bold text-slate-900 dark:text-slate-100">
        {value}
      </div>
    </div>
  );
}

/* =========================
 * Formatting
 * ========================= */
function formatShortDayUz(dateISO: string) {
  const d = new Date(dateISO + "T00:00:00");
  const wd = d.toLocaleDateString("uz-UZ", { weekday: "short" });
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${wd} • ${dd}.${mm}`;
}

function formatDayTitleUz(dateISO: string) {
  const d = new Date(dateISO + "T00:00:00");
  return d.toLocaleDateString("uz-UZ", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatUpdatedUz(timeLocal: string) {
  // timeLocal odatda: "2026-01-21 10:45"
  const safe = timeLocal.replace(" ", "T");
  const d = new Date(safe);
  if (Number.isNaN(d.getTime())) return timeLocal;

  const date = d.toLocaleDateString("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("uz-UZ", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${date} • ${time}`;
}

/* =========================
 * Panel
 * ========================= */
export function WeatherPanel({
  weather,
}: {
  weather: ReturnType<typeof useCurrentWeatherDetailed>;
}) {
  const [pickedISO, setPickedISO] = useState<string | null>(null);

  const location =
    weather.city || weather.admin1 || weather.country
      ? [weather.city, weather.admin1, weather.country].filter(Boolean).join(", ")
      : "Manzil aniqlanmoqda...";

  const updated =
    weather.timeLocal && !weather.loading && !weather.error
      ? formatUpdatedUz(weather.timeLocal)
      : null;

  const picked =
    (pickedISO && weather.daily.find((d) => d.dateISO === pickedISO)) ||
    weather.daily[0] ||
    null;

  const pickedTitle = picked ? formatDayTitleUz(picked.dateISO) : null;

  return (
    <div className="w-full overflow-hidden rounded-2xl sm:w-[380px]">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-600 p-4 text-white">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-14 -left-14 h-44 w-44 rounded-full bg-white/10 blur-2xl" />

        <div className="relative flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/25">
            <IconCloud className="h-6 w-6" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold">
              {weather.loading
                ? "Ob-havo"
                : weather.error
                  ? "Ob-havo mavjud emas"
                  : "Joriy ob-havo"}
            </div>

            <div className="mt-0.5 text-xs text-white/85">{location}</div>

            <div className="mt-2 text-[13px] font-semibold text-white/95">
              {weather.loading
                ? "Yuklanmoqda..."
                : weather.error
                  ? "Internetni tekshiring"
                  : `${weather.tempC ?? "--"}°C • ${weather.desc ?? "—"}`}
            </div>

            {updated ? (
              <div className="mt-1 text-[11px] text-white/80">
                Yangilandi: {updated}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="bg-white p-4 ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800">
        {/* Current details */}
        <div className="grid grid-cols-2 gap-2">
          <MiniStat
            label="SHAMOL"
            value={weather.windKmh != null ? `${weather.windKmh} km/soat` : "--"}
          />
          <MiniStat
            label="YO‘NALISH"
            value={weather.windDir != null ? `${weather.windDir}°` : "--"}
          />
          <MiniStat
            label="NAMLIK"
            value={weather.humidity != null ? `${weather.humidity}%` : "--"}
          />
          <MiniStat
            label="HIS QILINADI"
            value={weather.feelsLikeC != null ? `${weather.feelsLikeC}°C` : "--"}
          />
        </div>

        {/* 7 day forecast */}
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              7 kunlik prognoz
            </div>
            {pickedTitle ? (
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Tanlandi: {pickedTitle}
              </div>
            ) : null}
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {(weather.daily ?? []).slice(0, 7).map((d) => {
              const active =
                (pickedISO ?? weather.daily?.[0]?.dateISO) === d.dateISO;

              return (
                <button
                  type="button"
                  key={d.dateISO}
                  onClick={() => setPickedISO(d.dateISO)}
                  className={[
                    "min-w-[128px] rounded-2xl p-3 text-left ring-1 transition",
                    active
                      ? "bg-blue-600 text-white ring-blue-400/30 shadow-[0_12px_24px_rgba(37,99,235,0.25)]"
                      : "bg-slate-50 text-slate-800 ring-slate-200 hover:bg-slate-100 dark:bg-slate-950/40 dark:text-slate-100 dark:ring-slate-800 dark:hover:bg-slate-800",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "text-[11px] font-semibold",
                      active
                        ? "text-white/90"
                        : "text-slate-500 dark:text-slate-400",
                    ].join(" ")}
                  >
                    {formatShortDayUz(d.dateISO)}
                  </div>

                  <div className="mt-1 text-sm font-bold">
                    {d.tMax != null && d.tMin != null
                      ? `${d.tMax}° / ${d.tMin}°`
                      : "--"}
                  </div>

                  <div
                    className={[
                      "mt-1 text-[11px]",
                      active
                        ? "text-white/85"
                        : "text-slate-600 dark:text-slate-300",
                    ].join(" ")}
                  >
                    {d.desc ?? "—"}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Picked day detail */}
          {picked ? (
            <div className="mt-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200 dark:bg-slate-950/40 dark:ring-slate-800">
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                {formatDayTitleUz(picked.dateISO)}
              </div>

              <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                {picked.desc ?? "—"} •{" "}
                {picked.tMax != null ? `Maks: ${picked.tMax}°C` : "Maks: --"} •{" "}
                {picked.tMin != null ? `Min: ${picked.tMin}°C` : "Min: --"}
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2">
                <MiniStat
                  label="YOG‘INGARCHILIK"
                  value={picked.precipMm != null ? `${picked.precipMm} mm` : "--"}
                />
                <MiniStat
                  label="SHAMOL (MAX)"
                  value={
                    picked.windMaxKmh != null
                      ? `${picked.windMaxKmh} km/soat`
                      : "--"
                  }
                />
              </div>
            </div>
          ) : null}
        </div>

        {/* Error */}
        {weather.error && (
          <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/30">
            {weather.error}
          </div>
        )}
      </div>
    </div>
  );
}
