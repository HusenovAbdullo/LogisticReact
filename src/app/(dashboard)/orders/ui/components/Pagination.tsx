"use client";

import React from "react";
import Button from "./ui/Button";

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
  const pages = Math.max(1, Math.ceil((total || 0) / (pageSize || 1)));
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div className="text-sm text-slate-500">
        Topildi: <b className="text-slate-900">{total}</b>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-500">Sahifa hajmi</span>
        <select
          className="h-10 px-3 rounded-xl border border-slate-200 bg-white"
          value={pageSize}
          onChange={(e) => onPageSize(Number(e.target.value))}
        >
          {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(Math.max(1, page - 1))}>
          Oldingi
        </Button>
        <div className="text-sm">
          {page} / {pages}
        </div>
        <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => onPage(Math.min(pages, page + 1))}>
          Keyingi
        </Button>
      </div>
    </div>
  );
}
