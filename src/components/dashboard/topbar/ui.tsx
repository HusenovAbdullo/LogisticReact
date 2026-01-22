// src/components/dashboard/topbar/ui.tsx
"use client";

import React from "react";

export function Pill({
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


export function IconButton({
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
