"use client";

import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "danger";
  size?: "sm" | "md";
};

export default function Button({ variant = "primary", size = "md", className = "", ...props }: Props) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = size === "sm" ? "text-sm px-3 py-2" : "text-sm px-4 py-2.5";
  const vars: Record<string, string> = {
    primary: "bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-300",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 focus:ring-slate-200",
    outline: "border border-slate-200 bg-white hover:bg-slate-50 text-slate-900 focus:ring-slate-200",
    danger: "bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-200",
  };
  return <button className={`${base} ${sizes} ${vars[variant]} ${className}`} {...props} />;
}
