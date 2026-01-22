// src/features/weather/useCurrentWeatherDetailed.ts
"use client";

import { useEffect, useState } from "react";

export function useCurrentWeatherDetailed() {
  const [state, setState] = useState<{
    loading: boolean;
    error: string | null;

    // current
    tempC: number | null;
    feelsLikeC: number | null;
    humidity: number | null;
    windKmh: number | null;
    windDir: number | null;
    code: number | null;
    desc: string | null;
    timeLocal: string | null;

    // location
    city: string | null;
    admin1: string | null;
    country: string | null;

    // daily
    daily: Array<{
      dateISO: string; // YYYY-MM-DD
      code: number | null;
      desc: string | null;
      tMax: number | null;
      tMin: number | null;
      windMaxKmh: number | null;
      precipMm: number | null;
    }>;
  }>({
    loading: true,
    error: null,

    tempC: null,
    feelsLikeC: null,
    humidity: null,
    windKmh: null,
    windDir: null,
    code: null,
    desc: null,
    timeLocal: null,

    city: null,
    admin1: null,
    country: null,

    daily: [],
  });

  useEffect(() => {
    let cancelled = false;

    async function run(lat: number, lon: number) {
      try {
        setState((s) => ({ ...s, loading: true, error: null }));

        const url =
          `https://api.open-meteo.com/v1/forecast` +
          `?latitude=${encodeURIComponent(lat)}` +
          `&longitude=${encodeURIComponent(lon)}` +
          `&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m` +
          `&daily=weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,precipitation_sum` +
          `&timezone=auto`;

        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error("Ob-havo xizmati javob bermadi");

        const data = await res.json();
        const cur = data?.current ?? {};
        const daily = data?.daily ?? {};

        const tempC =
          typeof cur.temperature_2m === "number"
            ? Math.round(cur.temperature_2m)
            : null;
        const feelsLikeC =
          typeof cur.apparent_temperature === "number"
            ? Math.round(cur.apparent_temperature)
            : null;
        const humidity =
          typeof cur.relative_humidity_2m === "number"
            ? Math.round(cur.relative_humidity_2m)
            : null;
        const windKmh =
          typeof cur.wind_speed_10m === "number"
            ? Math.round(cur.wind_speed_10m)
            : null;
        const windDir =
          typeof cur.wind_direction_10m === "number"
            ? Math.round(cur.wind_direction_10m)
            : null;

        const code =
          typeof cur.weather_code === "number" ? cur.weather_code : null;
        const desc =
          typeof code === "number" ? weatherCodeToTextUz(code) : null;

        const timeLocal =
          typeof cur.time === "string" ? cur.time.replace("T", " ") : null;

        const geo = await reverseGeocodeUz(lat, lon);

        const dailyArr: Array<{
          dateISO: string;
          code: number | null;
          desc: string | null;
          tMax: number | null;
          tMin: number | null;
          windMaxKmh: number | null;
          precipMm: number | null;
        }> = [];

        const times: string[] = Array.isArray(daily?.time) ? daily.time : [];
        const codes: any[] = Array.isArray(daily?.weather_code)
          ? daily.weather_code
          : [];
        const tMaxs: any[] = Array.isArray(daily?.temperature_2m_max)
          ? daily.temperature_2m_max
          : [];
        const tMins: any[] = Array.isArray(daily?.temperature_2m_min)
          ? daily.temperature_2m_min
          : [];
        const windMaxs: any[] = Array.isArray(daily?.wind_speed_10m_max)
          ? daily.wind_speed_10m_max
          : [];
        const precs: any[] = Array.isArray(daily?.precipitation_sum)
          ? daily.precipitation_sum
          : [];

        for (let i = 0; i < times.length; i++) {
          const c = typeof codes[i] === "number" ? codes[i] : null;
          dailyArr.push({
            dateISO: times[i],
            code: c,
            desc: typeof c === "number" ? weatherCodeToTextUz(c) : null,
            tMax: typeof tMaxs[i] === "number" ? Math.round(tMaxs[i]) : null,
            tMin: typeof tMins[i] === "number" ? Math.round(tMins[i]) : null,
            windMaxKmh:
              typeof windMaxs[i] === "number" ? Math.round(windMaxs[i]) : null,
            precipMm:
              typeof precs[i] === "number" ? Math.round(precs[i]) : null,
          });
        }

        if (!cancelled) {
          setState({
            loading: false,
            error: null,

            tempC,
            feelsLikeC,
            humidity,
            windKmh,
            windDir,
            code,
            desc,
            timeLocal,

            city: geo?.city ?? null,
            admin1: geo?.admin1 ?? null,
            country: geo?.country ?? null,

            daily: dailyArr,
          });
        }
      } catch (e: any) {
        if (!cancelled) {
          setState((s) => ({
            ...s,
            loading: false,
            error: e?.message ?? "Xatolik",
          }));
        }
      }
    }

    const fallbackLat = 41.3111;
    const fallbackLon = 69.2797;

    if (!navigator.geolocation) {
      run(fallbackLat, fallbackLon);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => run(pos.coords.latitude, pos.coords.longitude),
      () => run(fallbackLat, fallbackLon),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60_000 },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

async function reverseGeocodeUz(lat: number, lon: number) {
  try {
    const res = await fetch(
      `/api/reverse-geocode?lat=${lat}&lon=${lon}`,
      { cache: "no-store" }
    );

    if (!res.ok) return null;

    const data = await res.json();

    if (!data?.city && !data?.admin1 && !data?.country) return null;

    return {
      city: data.city ?? null,
      admin1: data.admin1 ?? null,
      country: data.country ?? null,
    };
  } catch {
    return null;
  }
}



function weatherCodeToTextUz(code: number) {
  if (code === 0) return "Ochiq";
  if (code === 1 || code === 2) return "Qisman bulutli";
  if (code === 3) return "Bulutli";
  if (code === 45 || code === 48) return "Tuman";
  if (code >= 51 && code <= 57) return "Mayda yomg‘ir";
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82))
    return "Yomg‘ir";
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return "Qor";
  if (code >= 95) return "Momaqaldiroq";
  return "Ob-havo";
}
