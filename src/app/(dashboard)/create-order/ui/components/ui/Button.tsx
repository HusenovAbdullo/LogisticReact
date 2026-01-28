"use client";

import React from "react";

export default function Button({
  className = "",
  variant = "solid",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "outline";
}) {
  const base =
    "h-11 rounded-2xl px-4 text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed";
  const solid =
    "bg-blue-600 text-white hover:bg-blue-700 shadow-[0_14px_24px_rgba(37,99,235,0.25)]";
  const outline =
    "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800";

  return (
    <button
      {...props}
      className={[base, variant === "outline" ? outline : solid, className].join(" ")}
    />
  );
}
