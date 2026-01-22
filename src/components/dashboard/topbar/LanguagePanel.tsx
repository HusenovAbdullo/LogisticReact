// src/components/dashboard/topbar/LanguagePanel.tsx
"use client";

import React from "react";
import { useI18n } from "@/shared/i18n/useI18n";
import type { Locale } from "@/shared/i18n";

export function LanguagePanel({
  current,
  onPick,
}: {
  current: Locale;
  onPick: (code: Locale) => void;
}) {
  const { t } = useI18n(current);

  const items: Array<{ code: Locale; label: string }> = [
    { code: "uz", label: t("lang_uz") },
    { code: "ru", label: t("lang_ru") },
    { code: "en", label: t("lang_en") },
  ];

  return (
    <div className="w-full p-2 sm:w-[260px]">
      <div className="rounded-2xl bg-white p-2 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <div className="px-2 pb-2 pt-1 text-xs font-semibold text-slate-500 dark:text-slate-300">
          {t("language")}
        </div>

        <div className="space-y-1">
          {items.map((it) => {
            const active = it.code === current;
            return (
              <button
                key={it.code}
                type="button"
                onClick={() => onPick(it.code)}
                className={[
                  "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition",
                  active
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200"
                    : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800",
                ].join(" ")}
              >
                <span className="font-semibold">{it.label}</span>
                <span className="text-slate-400">{active ? "✓" : "›"}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
