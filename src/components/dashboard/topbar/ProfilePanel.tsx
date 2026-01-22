// src/components/dashboard/topbar/ProfilePanel.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconActivity,
  IconDollar,
  IconHelp,
  IconLogout,
  IconSettings,
  IconUser,
} from "@/shared/ui/icons";

export function ProfilePanel() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onLogout() {
    if (loading) return;
    setLoading(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        // same-origin bo'lgani uchun shart emas, lekin qolsa ham bo'ladi
        credentials: "include",
        cache: "no-store",
      });
    } catch {
      // ignore
    } finally {
      // logout route 200 qaytarmasa ham, baribir login'ga chiqaramiz
      router.replace("/login");
      router.refresh();
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

        <div className="my-2 border-t border-slate-200/70 dark:border-slate-800" />

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
    <button
      type="button"
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
    >
      <span className="text-slate-400 dark:text-slate-400">{icon}</span>
      <span className="flex-1">{label}</span>
      <span className="text-slate-400">›</span>
    </button>
  );
}
