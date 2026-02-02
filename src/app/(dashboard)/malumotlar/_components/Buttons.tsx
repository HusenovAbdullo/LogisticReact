"use client";

import React from "react";

type Variant = "primary" | "secondary" | "danger";

const styles: Record<Variant, string> = {
  primary:
    "bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-200",
  secondary:
    "bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 focus:ring-slate-200",
  danger:
    "bg-rose-600 text-white hover:bg-rose-500 focus:ring-rose-200",
};

export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
}) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium outline-none focus:ring-2 disabled:opacity-50 ${styles[variant]} ${className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function IconButton({
  title,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  title: string;
}) {
  return (
    <button
      {...props}
      title={title}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}
