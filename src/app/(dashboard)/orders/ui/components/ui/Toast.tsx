"use client";

import React, { useEffect } from "react";

export default function Toast({ type, message, open, onClose }: { type: "success" | "error" | "info"; message: string; open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(onClose, 2400);
    return () => window.clearTimeout(t);
  }, [open, onClose]);

  if (!open) return null;

  const cls =
    type === "success"
      ? "bg-emerald-600"
      : type === "error"
      ? "bg-rose-600"
      : "bg-slate-900";

  return (
    <div className={`fixed top-5 right-5 z-[10000] ${cls} text-white px-4 py-2 rounded-xl shadow-lg`}>
      {message}
    </div>
  );
}
