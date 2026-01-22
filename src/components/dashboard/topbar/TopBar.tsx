// src/components/dashboard/topbar/TopBar.tsx
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/shared/i18n/useI18n";
import { useLocale } from "@/shared/i18n/useLocale";
import type { Theme } from "./types";

import { FloatingPanel } from "./FloatingPanel";
import { NotificationsPanel } from "./NotificationsPanel";
import { ProfilePanel } from "./ProfilePanel";
import { LanguagePanel } from "./LanguagePanel";
import { IconButton, Pill } from "./ui";

import { CalendarPanel } from "@/features/calendar/CalendarPanel";
import { WeatherPanel } from "@/features/weather/WeatherPanel";
import { useCurrentWeatherDetailed } from "@/features/weather/useCurrentWeatherDetailed";

import { formatDMY, toISODate } from "@/features/calendar/uzCalendar";

import {
  BurgerIcon,
  FlagBadge,
  IconBell,
  IconCalendar,
  IconCloud,
  IconFullscreen,
  IconMoon,
  IconSearch,
  IconSun,
} from "@/shared/ui/icons";

export function TopBar({
  onOpenMenu,
  theme,
  setTheme,
}: {
  onOpenMenu: () => void;
  theme: Theme;
  setTheme: (v: Theme) => void;
}) {
  const weather = useCurrentWeatherDetailed();

  const [dateOpen, setDateOpen] = useState(false);
  const [weatherOpen, setWeatherOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const { locale, setLocale } = useLocale();
  const { t } = useI18n(locale);

  // SSR-safe vaqt
  const [dateText, setDateText] = useState("—");
  const [timeText, setTimeText] = useState("—");

  const rootRef = useRef<HTMLDivElement | null>(null);

  const closeAll = useCallback(() => {
    setDateOpen(false);
    setWeatherOpen(false);
    setNotifOpen(false);
    setProfileOpen(false);
    setLangOpen(false);
  }, []);

  const toggleOnly = useCallback(
    (key: "date" | "weather" | "notif" | "profile" | "lang") => {
      setDateOpen(key === "date" ? (v) => !v : false);
      setWeatherOpen(key === "weather" ? (v) => !v : false);
      setNotifOpen(key === "notif" ? (v) => !v : false);
      setProfileOpen(key === "profile" ? (v) => !v : false);
      setLangOpen(key === "lang" ? (v) => !v : false);
    },
    [],
  );

  // outside click + ESC
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) closeAll();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeAll();
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [closeAll]);

  // Hydration-safe clock
  useEffect(() => {
    const intlLocale =
      locale === "ru" ? "ru-RU" : locale === "en" ? "en-US" : "uz-UZ";

    const tick = () => {
      const now = new Date();
      setDateText(formatDMY(toISODate(now)));
      setTimeText(
        now.toLocaleTimeString(intlLocale, {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [locale]);

  // fullscreen
  const [isFs, setIsFs] = useState(false);
  useEffect(() => {
    const handler = () => setIsFs(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement)
        await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch {}
  }

  return (
    <header className="sticky top-0 z-30" ref={rootRef}>
      <div className="bg-white shadow-sm ring-1 ring-slate-200/70 sm:mx-6 sm:mt-5 sm:rounded-2xl dark:bg-slate-900 dark:ring-slate-800">
        <div className="flex items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-5 sm:py-4">
          {/* Mobile: menu + logo */}
          <div className="flex items-center gap-3 sm:hidden">
            <button
              type="button"
              onClick={onOpenMenu}
              className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
              aria-label={t("open_menu")}
              title={t("open_menu")}
            >
              <BurgerIcon />
            </button>

            <div className="text-lg font-extrabold tracking-tight">
              Next<span className="text-slate-400">Line</span>
            </div>
          </div>

          {/* Tablet+: date/weather pills */}
          <div className="hidden items-center gap-3 sm:flex">
            {/* Date */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleOnly("date")}
                aria-haspopup="dialog"
                aria-expanded={dateOpen}
              >
                <Pill
                  icon={<IconCalendar className="h-4 w-4" />}
                  label={dateText}
                  sub={timeText}
                />
              </button>

              {dateOpen && (
                <FloatingPanel align="left">
                  <CalendarPanel />
                </FloatingPanel>
              )}
            </div>

            {/* Weather */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleOnly("weather")}
                aria-haspopup="dialog"
                aria-expanded={weatherOpen}
              >
                <Pill
                  icon={<IconCloud className="h-4 w-4" />}
                  label={
                    weather.loading
                      ? t("weather")
                      : weather.error
                        ? t("weather_unavailable")
                        : weather.tempC != null
                          ? `${weather.tempC}°C`
                          : t("weather")
                  }
                  sub={
                    weather.loading
                      ? t("loading")
                      : weather.error
                        ? t("check_connection")
                        : (weather.desc ?? undefined)
                  }
                />
              </button>

              {weatherOpen && (
                <FloatingPanel align="left">
                  <WeatherPanel weather={weather} />
                </FloatingPanel>
              )}
            </div>
          </div>

          <div className="flex-1" />

          {/* Search (desktop only) */}
          <div className="relative hidden w-[520px] max-w-[38vw] lg:block">
            <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              placeholder={t("search")}
              className="w-full rounded-full border border-slate-200 bg-slate-50/60 py-2.5 pl-11 pr-4 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/30 dark:border-slate-800 dark:bg-slate-950/40 dark:focus:bg-slate-950"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Theme */}
            <IconButton
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              title={t("theme")}
            >
              {theme === "light" ? (
                <IconSun className="h-5 w-5" />
              ) : (
                <IconMoon className="h-5 w-5" />
              )}
            </IconButton>

            {/* Notifications */}
            <div className="relative">
              <IconButton onClick={() => toggleOnly("notif")} title={t("notifications")}>
                <span className="relative overflow-visible">
                  <IconBell className="h-5 w-5" />
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-500" />
                </span>
              </IconButton>

              {notifOpen && (
                <FloatingPanel align="right">
                  <NotificationsPanel />
                </FloatingPanel>
              )}
            </div>

            {/* Language */}
            <div className="relative">
              <IconButton onClick={() => toggleOnly("lang")} title={t("language")}>
                <FlagBadge code={locale} />
              </IconButton>

              {langOpen && (
                <FloatingPanel align="right">
                  <LanguagePanel
                    current={locale}
                    onPick={(code) => {
                      setLocale(code);
                      setLangOpen(false);
                    }}
                  />
                </FloatingPanel>
              )}
            </div>

            {/* Fullscreen (md+) */}
            <div className="hidden md:block">
              <IconButton
                onClick={toggleFullscreen}
                title={isFs ? t("exit_fullscreen") : t("fullscreen")}
              >
                <IconFullscreen className="h-5 w-5" />
              </IconButton>
            </div>

            {/* Profile */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleOnly("profile")}
                className="ml-1 h-10 w-10 overflow-hidden rounded-full ring-2 ring-slate-200 transition hover:opacity-90 dark:ring-slate-800"
                aria-haspopup="menu"
                aria-expanded={profileOpen}
                title={t("profile")}
              >
                <div className="h-full w-full bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-700 dark:to-slate-800" />
              </button>

              {profileOpen && (
                <FloatingPanel align="right">
                  <ProfilePanel />
                </FloatingPanel>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
