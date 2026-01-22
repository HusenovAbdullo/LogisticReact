// src/components/dashboard/topbar/NotificationsPanel.tsx
"use client";

import React from "react";
import { IconDot } from "@/shared/ui/icons";

export function NotificationsPanel() {
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


