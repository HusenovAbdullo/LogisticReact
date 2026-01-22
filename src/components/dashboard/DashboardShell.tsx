// src/components/dashboard/DashboardShell.tsx
"use client";

import React, { useEffect, useState } from "react";
import type { Theme } from "./topbar/types";
import { Sidebar } from "./sidebar/Sidebar";
import { TopBar } from "./topbar/TopBar";

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
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")
      ?.matches;
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
