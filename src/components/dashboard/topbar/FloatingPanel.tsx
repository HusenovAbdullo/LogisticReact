// src/components/dashboard/topbar/FloatingPanel.tsx
"use client";

import React, { useEffect, useRef } from "react";

export function FloatingPanel({
  children,
  align,
}: {
  children: React.ReactNode;
  align: "left" | "right";
}) {
  const side = align === "left" ? "sm:left-0" : "sm:right-0";

  return (
    <div
      className={[
        // MOBILE (default): viewportga yopishadi
        "fixed inset-x-3 top-[72px] z-50",
        "max-h-[70vh] overflow-auto",
        "rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800",

        // DESKTOP (sm+): trigger konteyneriga nisbatan ochiladi
        "sm:absolute sm:top-full sm:mt-3 sm:inset-x-auto",
        "sm:max-h-none sm:overflow-visible",

        // align
        side,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
