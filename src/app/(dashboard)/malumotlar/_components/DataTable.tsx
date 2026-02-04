"use client";

import React, { useEffect, useMemo, useState } from "react";
import Modal from "./Modal";
import { Button } from "./Buttons";
import { Store } from "../_lib/storage";

export type Column<T> = {
  key: string;
  header: React.ReactNode;
  render: (row: T) => React.ReactNode;
  className?: string;
  hideOnMobile?: boolean;
};

type Option = { value: string; label: string };

function uniq<T>(arr: T[]) {
  return Array.from(new Set(arr));
}

export type FilterItem<T> =
  | {
      key: string;
      label: string;
      type: "select";
      options: Option[];
      /** Defaults to row[key] */
      get?: (row: T) => any;
    }
  | {
      key: string;
      label: string;
      type: "multi";
      options: Option[];
      /** Defaults to row[key] */
      get?: (row: T) => any;
    }
  | {
      key: string;
      label: string;
      type: "text";
      placeholder?: string;
      /** Defaults to row[key] */
      get?: (row: T) => any;
    }
  | {
      key: string;
      label: string;
      type: "numberRange";
      minLabel?: string;
      maxLabel?: string;
      /** Defaults to row[key] */
      get?: (row: T) => any;
    }
  | {
      key: string;
      label: string;
      type: "dateRange";
      /** Defaults to row[key] */
      get?: (row: T) => any;
      fromLabel?: string;
      toLabel?: string;
    }
  | {
      key: string;
      label: string;
      type: "toggle";
      /** Defaults to row[key] */
      get?: (row: T) => any;
      trueLabel?: string;
    };

export type AdvancedFilterConfig<T> = {
  storageKey?: string;
  title?: string;
  description?: string;
  schema: FilterItem<T>[];
  initial?: Record<string, any>;
};

function asArray(v: any): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x));
  if (v == null || v === "") return [];
  return [String(v)];
}

function isTruthy(v: any): boolean {
  return v === true || v === "true" || v === 1 || v === "1";
}

function safeDate(v: any): Date | null {
  if (!v) return null;
  const d = new Date(String(v));
  return Number.isFinite(d.getTime()) ? d : null;
}

function fmtDateOnly(v: any): string {
  const d = safeDate(v);
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function getByKey<T>(row: T, key: string) {
  return (row as any)?.[key];
}

function applyAdvancedFilters<T>(rows: T[], schema: FilterItem<T>[], state: Record<string, any>) {
  let out = rows;

  for (const item of schema) {
    const v = state[item.key];

    if (item.type === "select") {
      const selected = String(v ?? "");
      if (!selected) continue;

      out = out.filter((r) => {
        const raw = item.get ? item.get(r) : getByKey(r, item.key);
        return String(raw ?? "") === selected;
      });
    }

    if (item.type === "multi") {
      const selected = asArray(v);
      if (selected.length === 0) continue;

      out = out.filter((r) => {
        const raw = item.get ? item.get(r) : getByKey(r, item.key);
        const rowArr = asArray(raw);
        if (rowArr.length === 0) return false;
        // any overlap
        return selected.some((s) => rowArr.includes(s));
      });
    }

    
    if (item.type === "text") {
      const needle = String(v ?? "").trim().toLowerCase();
      if (!needle) continue;

      out = out.filter((r) => {
        const raw = item.get ? item.get(r) : getByKey(r, item.key);
        const hay = String(raw ?? "").toLowerCase();
        return hay.includes(needle);
      });
    }

    if (item.type === "numberRange") {
      const minV = state[`${item.key}__min`];
      const maxV = state[`${item.key}__max`];

      const minN = minV === "" || minV == null ? null : Number(minV);
      const maxN = maxV === "" || maxV == null ? null : Number(maxV);

      if ((minN == null || !Number.isFinite(minN)) && (maxN == null || !Number.isFinite(maxN))) continue;

      out = out.filter((r) => {
        const raw = item.get ? item.get(r) : getByKey(r, item.key);
        const n = Number(raw);
        if (!Number.isFinite(n)) return false;
        if (minN != null && Number.isFinite(minN) && n < minN) return false;
        if (maxN != null && Number.isFinite(maxN) && n > maxN) return false;
        return true;
      });
    }

if (item.type === "toggle") {
      const enabled = isTruthy(v);
      if (!enabled) continue;

      out = out.filter((r) => {
        const raw = item.get ? item.get(r) : getByKey(r, item.key);
        return Boolean(raw) || isTruthy(raw);
      });
    }

    if (item.type === "dateRange") {
      const from = state[`${item.key}__from`] ?? "";
      const to = state[`${item.key}__to`] ?? "";

      const fromD = safeDate(from);
      const toD = safeDate(to);

      if (!fromD && !toD) continue;

      out = out.filter((r) => {
        const raw = item.get ? item.get(r) : getByKey(r, item.key);
        const rowD = safeDate(raw);
        if (!rowD) return false;

        if (fromD && rowD < startOfDay(fromD)) return false;
        if (toD && rowD > endOfDay(toD)) return false;
        return true;
      });
    }
  }

  return out;
}

function chipValueLabel<T>(item: FilterItem<T>, state: Record<string, any>): string[] {
  if (item.type === "select") {
    const selected = String(state[item.key] ?? "");
    if (!selected) return [];
    const opt = item.options.find((o) => o.value === selected);
    return [opt?.label ?? selected];
  }
  if (item.type === "multi") {
    const selected = asArray(state[item.key]);
    if (!selected.length) return [];
    return selected.map((s) => item.options.find((o) => o.value === s)?.label ?? s);
  }
  
  if (item.type === "text") {
    const needle = String(state[item.key] ?? "").trim();
    if (!needle) return [];
    return [`${item.label}: ${needle}`];
  }

  if (item.type === "numberRange") {
    const minV = state[`${item.key}__min`] ?? "";
    const maxV = state[`${item.key}__max`] ?? "";
    if (minV === "" && maxV === "") return [];
    if (minV !== "" && maxV !== "") return [`${item.label}: ${minV}–${maxV}`];
    if (minV !== "") return [`${item.label}: ≥${minV}`];
    return [`${item.label}: ≤${maxV}`];
  }

if (item.type === "toggle") {
    const enabled = isTruthy(state[item.key]);
    if (!enabled) return [];
    return [item.trueLabel ?? "Ha"];
  }
  if (item.type === "dateRange") {
    const from = state[`${item.key}__from`];
    const to = state[`${item.key}__to`];
    const f = from ? fmtDateOnly(from) : "";
    const t = to ? fmtDateOnly(to) : "";
    if (!f && !t) return [];
    if (f && t) return [`${f} → ${t}`];
    if (f) return [`${f} dan`];
    return [`${t} gacha`];
  }
  return [];
}

export default function DataTable<T extends { id: string }>({
  rows,
  columns,
  onRowClick,
  rowActions,
  searchKeys,
  advancedFilter,
  showToolbar = true,
  showSearch = true,
  showClear = true,
  defaultPageSize = 20,
  pageSizes = [20, 50, 100],
}: {
  rows: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  rowActions?: (row: T) => React.ReactNode;
  searchKeys?: (keyof T)[];
  advancedFilter?: AdvancedFilterConfig<T>;
  showToolbar?: boolean;
  showSearch?: boolean;
  showClear?: boolean;
  defaultPageSize?: number;
  pageSizes?: number[];
}) {
  const [q, setQ] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  const safePageSizes = useMemo(() => uniq([defaultPageSize, ...pageSizes]).map((x) => Number(x)).filter((x) => Number.isFinite(x) && x > 0), [defaultPageSize, pageSizes]);
  const [pageSize, setPageSize] = useState<number>(() => (safePageSizes.includes(defaultPageSize) ? defaultPageSize : safePageSizes[0] ?? 20));
  const [page, setPage] = useState(1);

  const storageKey = advancedFilter?.storageKey;

  const defaultFilterState = useMemo(() => {
    const baseInit = advancedFilter?.initial ?? {};
    const state: Record<string, any> = { ...baseInit };
    // Ensure dateRange keys exist
    for (const it of advancedFilter?.schema ?? []) {
      if (it.type === "dateRange") {
        state[`${it.key}__from`] = state[`${it.key}__from`] ?? "";
        state[`${it.key}__to`] = state[`${it.key}__to`] ?? "";
      }
      if (it.type === "multi") {
        state[it.key] = state[it.key] ?? [];
      }
      if (it.type === "select") {
        state[it.key] = state[it.key] ?? "";
      }
      if (it.type === "toggle") {
        state[it.key] = state[it.key] ?? false;
      }
    }
    return state;
  }, [advancedFilter]);

  const [filterState, setFilterState] = useState<Record<string, any>>(() => {
    if (!storageKey) return defaultFilterState;
    return Store.read(storageKey, defaultFilterState);
  });

  useEffect(() => {
    if (!storageKey) return;
    Store.write(storageKey, filterState);
  }, [storageKey, filterState]);

  useEffect(() => {
    // if schema changes (page switch), re-sync with defaults but keep existing values where possible
    setFilterState((prev) => {
      const next = { ...defaultFilterState, ...prev };
      // remove keys not present in defaults (clean-up)
      const allowed = new Set(Object.keys(defaultFilterState));
      for (const k of Object.keys(next)) {
        if (!allowed.has(k)) delete (next as any)[k];
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultFilterState]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const keys = searchKeys ?? ([] as (keyof T)[]);

    let out = rows;

    if (advancedFilter?.schema?.length) {
      out = applyAdvancedFilters(out, advancedFilter.schema, filterState);
    }

    if (!query) return out;

    return out.filter((r) => {
      if (keys.length === 0) {
        return JSON.stringify(r).toLowerCase().includes(query);
      }
      return keys.some((k) => String((r as any)[k] ?? "").toLowerCase().includes(query));
    });
  }, [q, rows, searchKeys, advancedFilter, filterState]);

  // ===== Pagination (client-side) =====
  const totalFiltered = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));

  useEffect(() => {
    // filter/q/pageSize o'zgarsa sahifani valid diapazonga tushirib qo'yamiz
    setPage((p) => {
      const next = Math.min(Math.max(1, p), totalPages);
      return next;
    });
  }, [totalPages]);

  const pageStart = (page - 1) * pageSize;
  const pageEnd = Math.min(pageStart + pageSize, totalFiltered);
  const paged = useMemo(() => filtered.slice(pageStart, pageEnd), [filtered, pageStart, pageEnd]);

  const pageNumbers = useMemo(() => {
    // compact pagination: [1] ... [p-1] [p] [p+1] ... [last]
    const nums: number[] = [];
    const add = (n: number) => {
      if (n < 1 || n > totalPages) return;
      if (!nums.includes(n)) nums.push(n);
    };
    add(1);
    add(page - 1);
    add(page);
    add(page + 1);
    add(totalPages);
    return nums.sort((a, b) => a - b);
  }, [page, totalPages]);

  const activeChips = useMemo(() => {
    if (!advancedFilter?.schema?.length) return [];
    const chips: { key: string; label: string; value: string; clear: () => void }[] = [];

    for (const it of advancedFilter.schema) {
      const vals = chipValueLabel(it, filterState);
      for (const v of vals) {
        const chipKey = `${it.key}__${v}`;
        chips.push({
          key: chipKey,
          label: it.label,
          value: v,
          clear: () => {
            setFilterState((s) => {
              const next = { ...s };
              if (it.type === "dateRange") {
                next[`${it.key}__from`] = "";
                next[`${it.key}__to`] = "";
              } else if (it.type === "multi") {
                next[it.key] = [];
              } else if (it.type === "toggle") {
                next[it.key] = false;
              } else {
                next[it.key] = "";
              }
              return next;
            });
          },
        });
      }
    }
    return chips;
  }, [advancedFilter, filterState]);

  const clearAll = () => {
    setQ("");
    setFilterState(defaultFilterState);
    if (storageKey) Store.write(storageKey, defaultFilterState);
    setPage(1);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      {showToolbar ? (
        <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-600">
            Ko‘rsatilmoqda:{" "}
            <span className="font-medium text-slate-900">{filtered.length}</span>
            <span className="text-slate-400"> / </span>
            <span className="font-medium text-slate-900">{rows.length}</span>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            {showSearch ? (
              <div className="w-full sm:w-80">
                <input
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Qidirish..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                />
              </div>
            ) : null}

            {advancedFilter?.schema?.length ? (
              <Button variant="secondary" onClick={() => setFilterOpen(true)} className="whitespace-nowrap">
                Filter
                {activeChips.length ? (
                  <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1.5 text-[11px] font-bold text-white">
                    {activeChips.length}
                  </span>
                ) : null}
              </Button>
            ) : null}

            {showClear ? (
              <Button variant="secondary" onClick={clearAll} className="whitespace-nowrap">
                Tozalash
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {showToolbar && activeChips.length ? (
        <div className="flex flex-wrap gap-2 px-3 pb-3">
          {activeChips.map((c) => (
            <button
              key={c.key}
              onClick={c.clear}
              className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
              title="Filtrni olib tashlash"
            >
              <span className="text-slate-500">{c.label}:</span>
              <span>{c.value}</span>
              <span className="text-slate-500">✕</span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-600">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={`px-4 py-3 font-semibold ${c.className ?? ""} ${c.hideOnMobile ? "hidden sm:table-cell" : ""}`}
                >
                  {c.header}
                </th>
              ))}
              {rowActions ? <th className="px-4 py-3 text-right">Amallar</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paged.map((r) => (
              <tr
                key={r.id}
                className={`hover:bg-slate-50 ${onRowClick ? "cursor-pointer" : ""}`}
                onClick={onRowClick ? () => onRowClick(r) : undefined}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={`px-4 py-3 align-middle ${c.className ?? ""} ${c.hideOnMobile ? "hidden sm:table-cell" : ""}`}
                  >
                    {c.render(r)}
                  </td>
                ))}
                {rowActions ? (
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    {rowActions(r)}
                  </td>
                ) : null}
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (rowActions ? 1 : 0)}
                  className="px-4 py-10 text-center text-slate-500"
                >
                  Ma’lumot topilmadi.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      <div className="flex flex-col gap-3 border-t border-slate-100 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-600">
          <span className="font-medium text-slate-900">Sahifa {page}</span>
          <span className="text-slate-400"> / </span>
          <span className="font-medium text-slate-900">{totalPages}</span>
          <span className="mx-2 text-slate-300">•</span>
          <span>
            Ko‘rsatilmoqda {totalFiltered === 0 ? 0 : pageStart + 1}-{pageEnd} / {totalFiltered}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <span className="whitespace-nowrap">Sahifada</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const next = Number(e.target.value);
                setPageSize(next);
                setPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
            >
              {safePageSizes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className={
                "rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold " +
                (page <= 1 ? "cursor-not-allowed bg-slate-50 text-slate-400" : "bg-white text-slate-700 hover:bg-slate-50")
              }
            >
              ←
            </button>

            {pageNumbers.map((n, i) => {
              const prev = pageNumbers[i - 1];
              const gap = prev != null && n - prev > 1;
              return (
                <React.Fragment key={n}>
                  {gap ? <span className="px-2 text-slate-400">…</span> : null}
                  <button
                    type="button"
                    onClick={() => setPage(n)}
                    className={
                      "min-w-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold " +
                      (n === page ? "bg-slate-900 text-white" : "bg-white text-slate-700 hover:bg-slate-50")
                    }
                    aria-current={n === page ? "page" : undefined}
                  >
                    {n}
                  </button>
                </React.Fragment>
              );
            })}

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className={
                "rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold " +
                (page >= totalPages
                  ? "cursor-not-allowed bg-slate-50 text-slate-400"
                  : "bg-white text-slate-700 hover:bg-slate-50")
              }
            >
              →
            </button>
          </div>
        </div>
      </div>

      {advancedFilter?.schema?.length ? (
        <Modal
          open={filterOpen}
          title={advancedFilter.title ?? "Filter"}
          onClose={() => setFilterOpen(false)}
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setFilterState(defaultFilterState);
                }}
              >
                Tozalash
              </Button>
              <Button onClick={() => setFilterOpen(false)}>Yopish</Button>
            </>
          }
        >
          {advancedFilter.description ? (
            <div className="mb-4 text-sm text-slate-600">{advancedFilter.description}</div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {advancedFilter.schema.map((it) => {
              if (it.type === "select") {
                const val = String(filterState[it.key] ?? "");
                const opts = it.options.some((o) => o.value === "") ? it.options : [{ value: "", label: "Barchasi" }, ...it.options];
                return (
                  <label key={it.key} className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-slate-700">{it.label}</span>
                    <select
                      value={val}
                      onChange={(e) => setFilterState((s) => ({ ...s, [it.key]: e.target.value }))}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                    >
                      {opts.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                );
              }

              if (it.type === "multi") {
                const val = asArray(filterState[it.key]);
                return (
                  <label key={it.key} className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-slate-700">{it.label}</span>
                    <div className="space-y-2">
                      <select
                        value=""
                        onChange={(e) => {
                          const v = String(e.currentTarget.value || "");
                          if (!v) return;
                          setFilterState((s) => ({ ...s, [it.key]: uniq([...val, v]) }));
                        }}
                        className="min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                      >
                        <option value="">Tanlang</option>
                        {it.options.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>

                      {val.length ? (
                        <div className="flex flex-wrap gap-1">
                          {val.map((x) => (
                            <button
                              type="button"
                              key={x}
                              onClick={() => setFilterState((s) => ({ ...s, [it.key]: val.filter((a) => a !== x) }))}
                              className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                            >
                              <span>{it.options.find((o) => o.value === x)?.label ?? x}</span>
                              <span className="text-slate-500">✕</span>
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </label>
                );
              }

              if (it.type === "toggle") {
                const checked = isTruthy(filterState[it.key]);
                return (
                  <label key={it.key} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => setFilterState((s) => ({ ...s, [it.key]: e.target.checked }))}
                      className="h-4 w-4"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-700">{it.label}</span>
                      <span className="text-xs text-slate-500">{it.trueLabel ?? "Yoqilgan bo‘lsa filtirlash"}</span>
                    </div>
                  </label>
                );
              }

              if (it.type === "text") {
                const val = String(filterState[it.key] ?? "");
                return (
                  <label key={it.key} className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-slate-700">{it.label}</span>
                    <input
                      type="text"
                      value={val}
                      placeholder={it.placeholder ?? "Kiriting..."}
                      onChange={(e) => setFilterState((s) => ({ ...s, [it.key]: e.target.value }))}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                    />
                  </label>
                );
              }

              if (it.type === "numberRange") {
                const minKey = `${it.key}__min`;
                const maxKey = `${it.key}__max`;
                const minVal = String(filterState[minKey] ?? "");
                const maxVal = String(filterState[maxKey] ?? "");
                return (
                  <div key={it.key} className="sm:col-span-2">
                    <div className="text-sm font-medium text-slate-700">{it.label}</div>
                    <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-slate-500">{it.minLabel ?? "Min"}</span>
                        <input
                          value={minVal}
                          onChange={(e) => setFilterState((s) => ({ ...s, [minKey]: e.target.value }))}
                          inputMode="decimal"
                          placeholder={it.minLabel ?? "Min"}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-slate-500">{it.maxLabel ?? "Max"}</span>
                        <input
                          value={maxVal}
                          onChange={(e) => setFilterState((s) => ({ ...s, [maxKey]: e.target.value }))}
                          inputMode="decimal"
                          placeholder={it.maxLabel ?? "Max"}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                        />
                      </label>
                    </div>
                  </div>
                );
              }

              if (it.type === "dateRange") {
                const fromKey = `${it.key}__from`;
                const toKey = `${it.key}__to`;
                const fromVal = String(filterState[fromKey] ?? "");
                const toVal = String(filterState[toKey] ?? "");
                return (
                  <div key={it.key} className="sm:col-span-2">
                    <div className="text-sm font-medium text-slate-700">{it.label}</div>
                    <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-slate-500">{it.fromLabel ?? "Dan"}</span>
                        <input
                          type="date"
                          value={fromVal ? fmtDateOnly(fromVal) : ""}
                          onChange={(e) => setFilterState((s) => ({ ...s, [fromKey]: e.target.value }))}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs text-slate-500">{it.toLabel ?? "Gacha"}</span>
                        <input
                          type="date"
                          value={toVal ? fmtDateOnly(toVal) : ""}
                          onChange={(e) => setFilterState((s) => ({ ...s, [toKey]: e.target.value }))}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                        />
                      </label>
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
