"use client";

import React, { useEffect } from "react";

export default function Modal({
  open,
  title,
  children,
  onClose,
  footer,
  widthClass = "max-w-3xl",
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
  widthClass?: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 flex items-end md:items-center justify-center p-0 md:p-6">
      <div className={`w-full ${widthClass} bg-white rounded-t-2xl md:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto`}>
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 p-4 md:p-5 flex items-center gap-3">
          <div className="text-lg font-semibold truncate">{title}</div>
          <button onClick={onClose} className="ml-auto h-9 w-9 rounded-xl hover:bg-slate-100 text-slate-600">✕</button>
        </div>
        <div className="p-4 md:p-5">{children}</div>
        {footer ? <div className="border-t border-slate-200 p-4 md:p-5">{footer}</div> : null}
      </div>
    </div>
  );
}
