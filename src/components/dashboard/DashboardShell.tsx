"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useMemo, useRef, useCallback, useState } from "react";
import { ROUTES } from "@/shared/constants/routes";
import { useI18n } from "@/shared/i18n/useI18n";



/* =========================
 * Types
 * ========================= */
type NavChild = { href: string; label: string };
type NavGroup = {
  key: string;
  href: string;
  label: string;
  icon: (p: { className?: string }) => React.ReactElement;
  children?: NavChild[];
};

type Lang = { code: "uz" | "ru" | "en"; label: string };

type Theme = "light" | "dark";

/* =========================
 * Component
 * ========================= */
export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, setTheme, mounted } = useTheme();

  // mounted bo‘lmaguncha theme icon “sakrash” bo‘lmasligi uchun
  const safeTheme: Theme = mounted ? theme : "light";

  return (
    <div className="min-h-screen bg-[#eef2ff] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex min-h-screen overflow-x-hidden">
        <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

        <main className="min-w-0 flex-1">
          <TopBar
            onOpenMenu={() => setMobileOpen(true)}
            theme={safeTheme}
            setTheme={setTheme}
          />

          <div className="px-3 py-3 sm:px-6 sm:py-6">
            <div className="bg-white shadow-sm ring-1 ring-slate-200/70 sm:rounded-2xl dark:bg-slate-900 dark:ring-slate-800">
              <div className="p-4 sm:p-6">{children}</div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* =========================
 * Theme Hook (real)
 *  - localStorage: "theme"
 *  - system preference fallback
 * ========================= */
function useTheme() {
  const [mounted, setMounted] = useState(false);
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    setMounted(true);

    const saved =
      typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    if (saved === "light" || saved === "dark") {
      setThemeState(saved);
      applyTheme(saved);
      return;
    }

    // system theme
    const prefersDark = window.matchMedia?.(
      "(prefers-color-scheme: dark)",
    )?.matches;
    const sys: Theme = prefersDark ? "dark" : "light";
    setThemeState(sys);
    applyTheme(sys);
  }, []);

  function setTheme(next: Theme) {
    setThemeState(next);
    try {
      localStorage.setItem("theme", next);
    } catch {}
    applyTheme(next);
  }

  return { theme, setTheme, mounted };
}

function applyTheme(t: Theme) {
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  root.classList.add(t); // "dark" yoki "light"
}

/* =========================
 * TopBar
 * ========================= */
/* =========================
 * TopBar
 * ========================= */
function TopBar({
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

  const LANG_STORAGE_KEY = "lang";

  const [lang, setLang] = useState<Lang>({
    code: "uz",
    label: "O‘zbek",
  });

  const { t } = useI18n(lang.code);

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


  // -------------------------
  // Mount effects
  // -------------------------

  // ✅ outside click + ESC
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

  // ✅ localStorage'dan tilni tiklash (client only)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY);
      const map: Record<Lang["code"], Lang> = {
        uz: { code: "uz", label: "O‘zbek" },
        ru: { code: "ru", label: "Русский" },
        en: { code: "en", label: "English" },
      };

      if (saved === "uz" || saved === "ru" || saved === "en") {
        setLang(map[saved]);
        document.documentElement.lang = saved;
      } else {
        document.documentElement.lang = "uz";
      }
    } catch {
      document.documentElement.lang = "uz";
    }
  }, []);

  // ✅ Hydration-safe clock: first render "—", mountdan keyin real vaqt
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setDateText(formatDMY(toISODate(now)));
      setTimeText(
        now.toLocaleTimeString("uz-UZ", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // ✅ fullscreen
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

  // ✅ til tanlash
  function pickLang(next: Lang) {
    setLang(next);
    setLangOpen(false);

    try {
      localStorage.setItem(LANG_STORAGE_KEY, next.code);
    } catch {}

    document.documentElement.lang = next.code;
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
              aria-label="Open menu"
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
                      ? "Ob-havo"
                      : weather.error
                        ? "Mavjud emas"
                        : weather.tempC != null
                          ? `${weather.tempC}°C`
                          : "Ob-havo"
                  }
                  sub={
                    weather.loading
                      ? "Yuklanmoqda..."
                      : weather.error
                        ? "Ulanishni tekshiring"
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
              title="Theme"
            >
              {theme === "light" ? (
                <IconSun className="h-5 w-5" />
              ) : (
                <IconMoon className="h-5 w-5" />
              )}
            </IconButton>

            {/* Notifications */}
            <div className="relative">
              <IconButton
                onClick={() => toggleOnly("notif")}
                title="Notifications"
              >
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

            {/* Language (mobile) */}
            <div className="relative md:hidden">
              <IconButton onClick={() => toggleOnly("lang")} title="Language">
                <FlagBadge code={lang.code} />
              </IconButton>

              {langOpen && (
                <FloatingPanel align="right">
                  <LanguagePanel current={lang.code} onPick={pickLang} />
                </FloatingPanel>
              )}
            </div>

            {/* Fullscreen (md+) */}
            <div className="hidden md:block">
              <IconButton
                onClick={toggleFullscreen}
                title={isFs ? "Exit fullscreen" : "Fullscreen"}
              >
                <IconFullscreen className="h-5 w-5" />
              </IconButton>
            </div>

            {/* Language (md+) */}
            <div className="relative hidden md:block">
              <IconButton onClick={() => toggleOnly("lang")} title="Language">
                <FlagBadge code={lang.code} />
              </IconButton>

              {langOpen && (
                <FloatingPanel align="right">
                  <LanguagePanel current={lang.code} onPick={pickLang} />
                </FloatingPanel>
              )}
            </div>

            {/* Profile */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleOnly("profile")}
                className="ml-1 h-10 w-10 overflow-hidden rounded-full ring-2 ring-slate-200 transition hover:opacity-90 dark:ring-slate-800"
                aria-haspopup="menu"
                aria-expanded={profileOpen}
                title="Profile"
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


/* =========================
 * Sidebar
 * ========================= */
function Sidebar({
  mobileOpen,
  setMobileOpen,
}: {
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const NAV: NavGroup[] = useMemo(
    () => [
      {
        key: "dashboard",
        href: ROUTES.dashboard,
        label: "Dashboard",
        icon: IconGrid,
        children: [
          { href: ROUTES.dashboard1, label: "Dashboard 1" },
          { href: ROUTES.dashboard2, label: "Dashboard 2" },
        ],
      },
      {
        key: "shipments",
        href: ROUTES.orders,
        label: "Shipments",
        icon: IconBox,
      },
      {
        key: "delivery",
        href: ROUTES.warehouse,
        label: "Delivery",
        icon: IconTruck,
      },
      {
        key: "clients",
        href: ROUTES.couriers,
        label: "Clients",
        icon: IconUsers,
      },
    ],
    [],
  );

  const [openKey, setOpenKey] = useState<string>(() => {
    const hit = NAV.find((n) =>
      (n.children ?? []).some((c) => pathname === c.href),
    );
    return hit?.key ?? "dashboard";
  });

  // close drawer on route
  useEffect(() => setMobileOpen(false), [pathname, setMobileOpen]);

  // scroll lock
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const widthClass = collapsed ? "w-[112px]" : "w-[280px]";
  const expanded = !collapsed;

  function isActiveGroup(item: NavGroup) {
    if (pathname === item.href) return true;
    return (item.children ?? []).some((c) => pathname === c.href);
  }

  function SidebarInner({ forceExpanded }: { forceExpanded?: boolean }) {
    const isExpanded = forceExpanded ?? expanded;

    return (
      <div className="h-full bg-white dark:bg-slate-900">
        {/* Brand */}
        <div
          className={[
            "flex items-center gap-3 pt-6",
            collapsed ? "px-3" : "px-6",
          ].join(" ")}
        >
          <div className="flex min-w-0 flex-1 items-center">
            {!collapsed || forceExpanded ? (
              <div className="text-2xl font-extrabold tracking-tight">
                Next<span className="text-slate-400">Line</span>
              </div>
            ) : (
              <div className="text-2xl font-extrabold tracking-tight">
                NL<span className="text-slate-400"></span>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              if (mobileOpen) return setMobileOpen(false);
              setCollapsed((v) => !v);
            }}
            className="grid h-12 w-12 place-items-center rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
            aria-label="Toggle sidebar"
            title="Toggle sidebar"
          >
            <BurgerIcon />
          </button>
        </div>

        <div className={["mt-8", collapsed ? "px-3" : "px-5"].join(" ")}>
          {isExpanded && (
            <div className="px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Menu
            </div>
          )}

          <div
            className={[
              "mt-3 rounded-3xl bg-slate-50 dark:bg-slate-950/40",
              collapsed ? "p-4" : "p-2",
            ].join(" ")}
          >
            {NAV.map((item) => {
              const Icon = item.icon;
              const activeGroup = isActiveGroup(item);
              const hasChildren = (item.children?.length ?? 0) > 0;
              const isOpen = openKey === item.key && isExpanded && hasChildren;

              return (
                <div key={item.key} className="mb-2 last:mb-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (!isExpanded) return router.push(item.href);
                      if (!hasChildren) return router.push(item.href);
                      setOpenKey((k) => (k === item.key ? "" : item.key));
                    }}
                    className={[
                      "w-full rounded-2xl transition",
                      isExpanded
                        ? "flex items-center gap-3 px-3 py-2.5 hover:bg-white dark:hover:bg-slate-900"
                        : "flex items-center justify-center py-3",
                      activeGroup ? "bg-white dark:bg-slate-900" : "",
                    ].join(" ")}
                    title={!isExpanded ? item.label : undefined}
                  >
                    <span
                      className={[
                        "grid place-items-center rounded-2xl transition",
                        isExpanded ? "h-10 w-10" : "h-16 w-16",
                        activeGroup
                          ? "bg-blue-600 text-white shadow-[0_14px_24px_rgba(37,99,235,0.25)]"
                          : "bg-white text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-800",
                      ].join(" ")}
                    >
                      <Icon
                        className={
                          activeGroup
                            ? "text-white"
                            : "text-slate-700 dark:text-slate-200"
                        }
                      />
                    </span>

                    {isExpanded && (
                      <>
                        <span className="flex-1 text-left text-sm font-medium text-slate-800 dark:text-slate-100">
                          {item.label}
                        </span>

                        {hasChildren ? (
                          <span
                            className={[
                              "text-xs transition",
                              isOpen
                                ? "rotate-180 text-slate-500"
                                : "text-slate-400",
                            ].join(" ")}
                          >
                            ▾
                          </span>
                        ) : null}
                      </>
                    )}
                  </button>

                  {/* Children */}
                  {isExpanded && isOpen && (
                    <div className="mt-2 space-y-1 rounded-2xl bg-white p-2 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
                      {(item.children ?? []).map((c) => {
                        const activeChild = pathname === c.href;
                        return (
                          <Link
                            key={c.href}
                            href={c.href}
                            className={[
                              "block rounded-xl px-3 py-2 text-sm transition",
                              activeChild
                                ? "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100",
                            ].join(" ")}
                          >
                            {c.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={[
          "sticky top-0 hidden h-screen shrink-0 border-r border-slate-200/70 bg-white sm:block dark:border-slate-800 dark:bg-slate-900",
          widthClass,
        ].join(" ")}
      >
        <SidebarInner />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <button
            className="absolute inset-0 bg-black/20"
            onClick={() => setMobileOpen(false)}
            aria-label="Close overlay"
          />
          <aside className="absolute left-0 top-0 h-full w-[84vw] max-w-[340px] border-r border-slate-200/70 bg-white dark:border-slate-800 dark:bg-slate-900">
            <SidebarInner forceExpanded />
          </aside>
        </div>
      )}
    </>
  );
}

/* =========================
 * Floating Panel
 * ========================= */
function FloatingPanel({
  children,
  align,
}: {
  children: React.ReactNode;
  align: "left" | "right";
}) {
  const side = align === "left" ? "sm:left-0" : "sm:right-0";

  return (
    <div
      className={[
        // MOBILE (default): viewportga yopishadi
        "fixed inset-x-3 top-[72px] z-50",
        "max-h-[70vh] overflow-auto",
        "rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800",

        // DESKTOP (sm+): trigger konteyneriga nisbatan ochiladi
        "sm:absolute sm:top-full sm:mt-3 sm:inset-x-auto",
        "sm:max-h-none sm:overflow-visible",

        // align
        side,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

/* =========================
 * Panels
 * ========================= */
function CalendarPanel() {
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
    <div className="w-full sm:w-[380px] overflow-hidden rounded-2xl">
      {/* ===== Header (kichik, zamonaviy) ===== */}
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
            if (!cell) {
              return <div key={idx} className="h-9" />;
            }

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

            // bayram / dam olish belgilari
            const holidayMark = m.isHoliday
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
                className={[base, ring, holidayMark, todayDot].join(" ")}
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

        {/* Reason / detail (kichik modern blok) */}
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

/* =========================
 * Calendar helpers (UZ)
 * ========================= */

const UZ_MONTHS = [
  "Yanvar",
  "Fevral",
  "Mart",
  "Aprel",
  "May",
  "Iyun",
  "Iyul",
  "Avgust",
  "Sentabr",
  "Oktabr",
  "Noyabr",
  "Dekabr",
];

const UZ_WEEKDAYS_SHORT = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"]; // Mon..Sun

function formatDMY(iso: string) {
  // "2026-01-21" -> "21.01.2026"
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

function formatLongUz(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("uz-UZ", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatWeekdayUz(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("uz-UZ", { weekday: "long" });
}

function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildMonthGrid(year: number, month0: number) {
  // month0: 0..11
  const first = new Date(year, month0, 1);
  const last = new Date(year, month0 + 1, 0);
  const daysInMonth = last.getDate();

  // JS getDay(): Sun=0..Sat=6 -> bizga Mon=0..Sun=6
  const jsDow = first.getDay(); // 0..6
  const offset = (jsDow + 6) % 7; // Mon-based

  const cells: Array<null | { iso: string; day: number }> = [];
  for (let i = 0; i < offset; i++) cells.push(null);

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month0, day);
    cells.push({ iso: toISODate(d), day });
  }

  // 6 qatorga chiroyli to‘ldirib qo‘yamiz (42 cell)
  while (cells.length < 42) cells.push(null);

  return cells;
}

/* =========================
 * Uzbekistan holidays / days off (2026)
 *  - bayram + qo‘shimcha dam olish kunlari
 * ========================= */

// NOTE: Bu ro‘yxatni keyin backend/config’dan olib keladigan qilsa ham bo‘ladi.
const UZ_CALENDAR_2026: Record<
  string,
  { kind: "holiday" | "extra_day_off"; title: string; note?: string }
> = {
  // Yangi yil
  "2026-01-01": { kind: "holiday", title: "Yangi yil" },
  "2026-01-02": {
    kind: "holiday",
    title: "Yangi yil (qo‘shimcha dam olish kuni)",
  },

  // 8 mart + ko‘chirilgan dam olish
  "2026-03-08": { kind: "holiday", title: "Xalqaro xotin-qizlar kuni" },
  "2026-03-09": {
    kind: "extra_day_off",
    title: "8 mart uchun qo‘shimcha dam olish kuni",
  },

  // Ramazon hayiti (taxminiy)
  "2026-03-20": {
    kind: "holiday",
    title: "Ramazon hayiti (Ro‘za hayit)",
    note: "Sana rasmiy e’lon bilan aniqlashtiriladi.",
  },

  // Navro‘z + qo‘shimcha dam olish
  "2026-03-21": { kind: "holiday", title: "Navro‘z bayrami" },
  "2026-03-23": {
    kind: "extra_day_off",
    title: "Navro‘z uchun qo‘shimcha dam olish kuni",
  },

  // 9 may + qo‘shimcha dam olish
  "2026-05-09": { kind: "holiday", title: "Xotira va qadrlash kuni" },
  "2026-05-11": {
    kind: "extra_day_off",
    title: "9 may uchun qo‘shimcha dam olish kuni",
  },

  // Qurbon hayiti (taxminiy) + uzaytirilgan dam olish
  "2026-05-27": {
    kind: "holiday",
    title: "Qurbon hayiti",
    note: "Sana rasmiy e’lon bilan aniqlashtiriladi.",
  },
  "2026-05-28": {
    kind: "extra_day_off",
    title: "Qurbon hayiti (qo‘shimcha dam olish kuni)",
  },
  "2026-05-29": {
    kind: "extra_day_off",
    title: "Qurbon hayiti (qo‘shimcha dam olish kuni)",
  },

  // Mustaqillik atrofidagi uzoq dam olish (rasmiy ish vaqti kalendari)
  "2026-08-31": {
    kind: "extra_day_off",
    title: "Mustaqillik bayrami oldidan qo‘shimcha dam olish kuni",
  },
  "2026-09-01": { kind: "holiday", title: "Mustaqillik kuni" },

  // O‘qituvchi va murabbiylar kuni
  "2026-10-01": { kind: "holiday", title: "O‘qituvchi va murabbiylar kuni" },

  // Konstitutsiya kuni
  "2026-12-08": { kind: "holiday", title: "Konstitutsiya kuni" },
};

function getUzWorkCalendarMeta(iso: string) {
  const d = new Date(iso + "T00:00:00");
  const jsDow = d.getDay(); // 0..6
  const isWeekend = jsDow === 0 || jsDow === 6; // yakshanba/shanba (5-kunlik ish haftasi uchun)

  const hit = UZ_CALENDAR_2026[iso];
  const isHoliday = hit?.kind === "holiday";
  const isExtraDayOff = hit?.kind === "extra_day_off";

  // label: sababi (bayram nomi / dam olish)
  let label: string | null = null;
  if (hit) label = hit.title;
  else if (isWeekend) label = jsDow === 6 ? "Shanba" : "Yakshanba";

  return {
    isWeekend,
    isHoliday,
    isExtraDayOff,
    label,
    sourceNote: hit?.note ?? null,
  };
}

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
      className="grid h-9 w-9 place-items-center rounded-2xl bg-slate-50 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100 dark:bg-slate-950/40 dark:text-slate-200 dark:ring-slate-800 dark:hover:bg-slate-800"
    >
      <span className="text-lg leading-none">{children}</span>
    </button>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
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

function WeatherPanel({
  weather,
}: {
  weather: ReturnType<typeof useCurrentWeatherDetailed>;
}) {
  const [pickedISO, setPickedISO] = useState<string | null>(null);

  const location =
    weather.city || weather.admin1 || weather.country
      ? [weather.city, weather.admin1, weather.country]
          .filter(Boolean)
          .join(", ")
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
    <div className="w-full sm:w-[380px] overflow-hidden rounded-2xl">
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
            value={
              weather.windKmh != null ? `${weather.windKmh} km/soat` : "--"
            }
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
            value={
              weather.feelsLikeC != null ? `${weather.feelsLikeC}°C` : "--"
            }
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
                  value={
                    picked.precipMm != null ? `${picked.precipMm} mm` : "--"
                  }
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

function formatShortDayUz(dateISO: string) {
  const d = new Date(dateISO + "T00:00:00");
  // "Chor • 21.01"
  const wd = d.toLocaleDateString("uz-UZ", { weekday: "short" });
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${wd} • ${dd}.${mm}`;
}

function formatDayTitleUz(dateISO: string) {
  const d = new Date(dateISO + "T00:00:00");
  // "21 yanvar 2026"
  return d.toLocaleDateString("uz-UZ", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function NotificationsPanel() {
  const items = [
    { tone: "green", title: "We've got something for you!" },
    { tone: "red", title: "Domain names expiring on Tuesday" },
    { tone: "blue", title: "Your commissions has been sent" },
    { tone: "yellow", title: "Security alert for your linked Google account" },
  ] as const;

  return (
    <div className="w-full overflow-hidden rounded-2xl sm:w-[340px]">
      {items.map((it, idx) => (
        <div
          key={idx}
          className={[
            "flex gap-3 px-4 py-4",
            idx === 0
              ? ""
              : "border-t border-slate-200/70 dark:border-slate-800",
          ].join(" ")}
        >
          <div
            className={[
              "mt-0.5 grid h-10 w-10 place-items-center rounded-full text-white",
              it.tone === "green"
                ? "bg-emerald-600"
                : it.tone === "red"
                  ? "bg-red-500"
                  : it.tone === "blue"
                    ? "bg-blue-600"
                    : "bg-amber-500",
            ].join(" ")}
          >
            <IconDot className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-slate-800 dark:text-slate-100">
              <span className="block overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]">
                {it.title}
              </span>
            </div>
          </div>
        </div>
      ))}

      <div className="border-t border-slate-200/70 px-4 py-3 dark:border-slate-800">
        <button className="w-full rounded-xl bg-slate-50 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:bg-slate-950/40 dark:text-slate-200 dark:hover:bg-slate-800">
          View all →
        </button>
      </div>
    </div>
  );
}

function ProfilePanel() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onLogout() {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      // logout route 200 qaytarmasa ham, baribir login'ga chiqaramiz
      router.replace("/login");
      router.refresh();
    } catch {
      router.replace("/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full p-3 sm:w-[320px]">
      <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200 dark:bg-slate-950/40 dark:ring-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 overflow-hidden rounded-full ring-2 ring-slate-200 dark:ring-slate-800">
            <div className="h-full w-full bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-700 dark:to-slate-800" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Abdullo
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              UI Expert
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 space-y-1">
        <MenuRow icon={<IconUser className="h-5 w-5" />} label="Profile" />
        <MenuRow icon={<IconSettings className="h-5 w-5" />} label="Settings" />
        <MenuRow icon={<IconDollar className="h-5 w-5" />} label="Billing" />
        <MenuRow icon={<IconActivity className="h-5 w-5" />} label="Activity" />
        <MenuRow icon={<IconHelp className="h-5 w-5" />} label="Help" />

        {/* Divider */}
        <div className="my-2 border-t border-slate-200/70 dark:border-slate-800" />

        {/* Logout */}
        <button
          type="button"
          onClick={onLogout}
          disabled={loading}
          className={[
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition",
            "text-red-600 hover:bg-red-50 disabled:opacity-60",
            "dark:text-red-300 dark:hover:bg-red-500/10",
          ].join(" ")}
        >
          <span className="text-red-500 dark:text-red-300">
            <IconLogout className="h-5 w-5" />
          </span>
          <span className="flex-1">{loading ? "Chiqilmoqda..." : "Logout"}</span>
          <span className="text-red-400">›</span>
        </button>
      </div>
    </div>
  );
}


function MenuRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800">
      <span className="text-slate-400 dark:text-slate-400">{icon}</span>
      <span className="flex-1">{label}</span>
      <span className="text-slate-400">›</span>
    </button>
  );
}

function LanguagePanel({
  current,
  onPick,
}: {
  current: string;
  onPick: (v: Lang) => void;
}) {
  const langs: Lang[] = [
    { code: "uz", label: "O‘zbek" },
    { code: "ru", label: "Русский" },
    { code: "en", label: "English" },
  ];

  return (
    <div className="w-full p-2 sm:w-[280px]">
      {langs.map((l) => {
        const active = l.code === current;
        return (
          <button
            key={l.code}
            onClick={() => onPick(l)}
            className={[
              "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition",
              active
                ? "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200"
                : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800",
            ].join(" ")}
          >
            <FlagBadge code={l.code} />
            <span className="flex-1">{l.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* =========================
 * UI small parts
 * ========================= */
function Pill({
  icon,
  label,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  sub?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-full bg-slate-50 px-4 py-2 ring-1 ring-slate-200 transition hover:bg-slate-100 dark:bg-slate-950/40 dark:ring-slate-800 dark:hover:bg-slate-800">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-blue-600 text-white">
        {icon}
      </span>
      <div className="leading-tight">
        <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          {label}
        </div>
        {sub ? (
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {sub}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function IconLogout({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M10 7V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M15 12H3m0 0 3-3M3 12l3 3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}


function IconButton({
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
      onClick={onClick}
      title={title}
      className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
    >
      {children}
    </button>
  );
}

/* =========================
 * Weather (detailed)
 * ========================= */
function useCurrentWeatherDetailed() {
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
    const r = data?.results?.[0];

    if (!r) return null;

    return {
      city: r.name,
      admin1: r.admin1,
      country: r.country,
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

/* =========================
 * Icons (same as yours)
 * ========================= */
function BurgerIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 6h16M4 12h16M4 18h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M7 3v3M17 3v3M4 8h16M6 6h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconCloud({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M7.5 18h10.3a4.2 4.2 0 0 0 .6-8.3A6 6 0 0 0 6.3 10.8 3.6 3.6 0 0 0 7.5 18Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconSearch({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M21 21l-4.3-4.3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconBell({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 19a2.5 2.5 0 0 0 5 0"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function IconFullscreen({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M9 3H3v6M15 3h6v6M9 21H3v-6M15 21h6v-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconSun({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconMoon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M21 13.2A7.5 7.5 0 0 1 10.8 3 9 9 0 1 0 21 13.2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconDot({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 6v6l4 2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconUser({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M4 21a8 8 0 0 1 16 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconSettings({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M19.4 15a7.9 7.9 0 0 0 .1-2l2-1.2-2-3.5-2.3.7a8.2 8.2 0 0 0-1.7-1l-.3-2.4H10.7l-.3 2.4a8.2 8.2 0 0 0-1.7 1l-2.3-.7-2 3.5 2 1.2a7.9 7.9 0 0 0 .1 2l-2 1.2 2 3.5 2.3-.7a8.2 8.2 0 0 0 1.7 1l.3 2.4h4.6l.3-2.4a8.2 8.2 0 0 0 1.7-1l2.3.7 2-3.5-2-1.2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconDollar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2v20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M17 7.5c0-2-2-3.5-5-3.5S7 5.5 7 7.5 9 11 12 11s5 1.5 5 3.5S15 18 12 18s-5-1.5-5-3.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconActivity({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M4 12h4l2-6 4 12 2-6h4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconHelp({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 18h.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M9.1 9a3 3 0 1 1 5.8 1c0 2-3 2-3 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function IconGrid({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function IconBox({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M21 8.5 12 3 3 8.5v7L12 21l9-5.5v-7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M3 8.5 12 13l9-4.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function IconTruck({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path d="M3 7h11v10H3V7Z" stroke="currentColor" strokeWidth="2" />
      <path d="M14 10h4l3 3v4h-7v-7Z" stroke="currentColor" strokeWidth="2" />
      <path d="M7 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" fill="currentColor" />
      <path d="M18 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" fill="currentColor" />
    </svg>
  );
}

function IconUsers({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M4 21a8 8 0 0 1 16 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
function FlagBadge({ code }: { code: "uz" | "ru" | "en" }) {
  return (
    <span className="grid h-9 w-9 place-items-center rounded-full bg-white ring-1 ring-slate-200 shadow-sm dark:bg-slate-900 dark:ring-slate-800">
      {code === "uz" ? <FlagUZ /> : code === "ru" ? <FlagRU /> : <FlagGB />}
    </span>
  );
}

function FlagUZ() {
  return (
    <span className="relative h-[18px] w-[22px] overflow-hidden rounded-[4px] ring-1 ring-black/5">
      <span className="absolute inset-x-0 top-0 h-[6px] bg-sky-500" />
      <span className="absolute inset-x-0 top-[6px] h-[6px] bg-white" />
      <span className="absolute inset-x-0 top-[12px] h-[6px] bg-emerald-500" />
      <span className="absolute inset-x-0 top-[5px] h-[1px] bg-rose-500/90" />
      <span className="absolute inset-x-0 top-[11px] h-[1px] bg-rose-500/90" />
    </span>
  );
}

function FlagRU() {
  return (
    <span className="relative h-[18px] w-[22px] overflow-hidden rounded-[4px] ring-1 ring-black/5">
      <span className="absolute inset-x-0 top-0 h-[6px] bg-white" />
      <span className="absolute inset-x-0 top-[6px] h-[6px] bg-blue-500" />
      <span className="absolute inset-x-0 top-[12px] h-[6px] bg-red-500" />
    </span>
  );
}

function FlagGB() {
  return (
    <span className="relative h-[18px] w-[22px] overflow-hidden rounded-[4px] ring-1 ring-black/5">
      <span className="absolute inset-0 bg-indigo-950" />
      <span className="absolute left-1/2 top-0 h-full w-[6px] -translate-x-1/2 bg-white/95" />
      <span className="absolute top-1/2 left-0 h-[6px] w-full -translate-y-1/2 bg-white/95" />
      <span className="absolute left-1/2 top-0 h-full w-[3px] -translate-x-1/2 bg-red-500" />
      <span className="absolute top-1/2 left-0 h-[3px] w-full -translate-y-1/2 bg-red-500" />
    </span>
  );
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
