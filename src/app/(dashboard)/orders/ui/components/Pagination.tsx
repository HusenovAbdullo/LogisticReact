"use client";

import React, { useMemo } from "react";
import Button from "./ui/Button";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function pageRange(current: number, totalPages: number) {
  // returns: (number | "…")[]
  // Example: 1 … 4 5 6 … 20
  const pages: Array<number | "…"> = [];
  const c = clamp(current, 1, totalPages);

  const push = (v: number | "…") => pages.push(v);

  const showLeft = c > 3;
  const showRight = c < totalPages - 2;

  // Always show first
  push(1);

  if (showLeft) push("…");

  const start = Math.max(2, c - 1);
  const end = Math.min(totalPages - 1, c + 1);

  for (let i = start; i <= end; i++) push(i);

  if (showRight) push("…");

  if (totalPages > 1) push(totalPages);

  // De-dup (edge cases)
  return pages.filter((v, idx) => pages.indexOf(v) === idx);
}

export default function Pagination({
  page,
  pageSize,
  total,
  onPage,
  onPageSize,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (p: number) => void;
  onPageSize: (n: number) => void;
}) {
  const pages = Math.max(1, Math.ceil((total || 0) / Math.max(1, pageSize || 1)));
  const safePage = clamp(page || 1, 1, pages);

  const itemsFrom = total ? (safePage - 1) * pageSize + 1 : 0;
  const itemsTo = total ? Math.min(total, safePage * pageSize) : 0;

  const range = useMemo(() => pageRange(safePage, pages), [safePage, pages]);

  const canPrev = safePage > 1;
  const canNext = safePage < pages;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Left: found + range */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 ring-1 ring-slate-200">
            <span className="text-xs text-slate-500">Topildi</span>
            <span className="text-xs font-semibold text-slate-900">{total}</span>
          </div>

          <div className="text-sm text-slate-600">
            {total ? (
              <>
                Ko‘rsatilyapti:{" "}
                <b className="text-slate-900">
                  {itemsFrom}-{itemsTo}
                </b>{" "}
                / <b className="text-slate-900">{total}</b>
              </>
            ) : (
              "Natija yo‘q"
            )}
          </div>
        </div>

        {/* Middle: page size */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Sahifa hajmi</span>
          <div className="relative">
            <select
              className="h-10 min-w-[92px] appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-9 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
              value={pageSize}
              onChange={(e) => onPageSize(Number(e.target.value))}
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <svg
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M7 10l5 5 5-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-slate-500"
              />
            </svg>
          </div>
        </div>

        {/* Right: controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!canPrev}
            onClick={() => onPage(1)}
          >
            ⟪
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={!canPrev}
            onClick={() => onPage(safePage - 1)}
          >
            Oldingi
          </Button>

          {/* Numeric pages */}
          <div className="hidden sm:flex items-center gap-1">
            {range.map((p, idx) =>
              p === "…" ? (
                <span
                  key={`dots-${idx}`}
                  className="px-2 text-sm text-slate-400 select-none"
                >
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => onPage(p)}
                  className={[
                    "h-9 min-w-9 px-3 rounded-xl text-sm transition ring-1",
                    p === safePage
                      ? "bg-slate-900 text-white ring-slate-900 shadow-sm"
                      : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50",
                  ].join(" ")}
                >
                  {p}
                </button>
              ),
            )}
          </div>

          {/* Compact page indicator for mobile */}
          <div className="sm:hidden inline-flex items-center rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
            <span className="text-sm font-semibold text-slate-900">{safePage}</span>
            <span className="mx-1 text-sm text-slate-400">/</span>
            <span className="text-sm text-slate-600">{pages}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={!canNext}
            onClick={() => onPage(safePage + 1)}
          >
            Keyingi
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={!canNext}
            onClick={() => onPage(pages)}
          >
            ⟫
          </Button>
        </div>
      </div>
    </div>
  );
}
