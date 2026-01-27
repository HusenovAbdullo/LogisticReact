"use client";

import React, { createContext, useContext, useMemo, useRef, useState } from "react";
import type { OrdersRepository } from "../../data/repository";
import { MockOrdersRepository } from "../../data/mockRepository";
import type { Order, OrderQuery, OrderSort, OrdersView, Paged } from "../../model/types";
import { DEFAULT_COLUMNS } from "../../model/constants";
import { uid } from "../../lib/format";

type OrdersState = {
  repo: OrdersRepository;

  query: OrderQuery;
  setQuery: (q: OrderQuery) => void;

  sort: OrderSort;
  setSort: (s: OrderSort) => void;

  page: number;
  setPage: (p: number) => void;

  pageSize: number;
  setPageSize: (n: number) => void;

  columns: Record<string, boolean>;
  setColumns: (c: Record<string, boolean>) => void;

  savedViews: OrdersView[];
  saveView: (name: string) => void;
  applyView: (id: string) => void;
  deleteView: (id: string) => void;

  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;

  data: Paged<Order> | null;
  setData: (d: Paged<Order> | null) => void;
};

const Ctx = createContext<OrdersState | null>(null);

const LS_KEY = "orders_views_v1";

function loadViews(): OrdersView[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
function persistViews(v: OrdersView[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(v)); } catch {}
}

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  // Repository: demo uchun mock. Keyin ApiOrdersRepository ga almashtirasiz.
  const repoRef = useRef<OrdersRepository | null>(null);
  if (!repoRef.current) repoRef.current = new MockOrdersRepository(180);

  const [query, setQuery] = useState<OrderQuery>({});
  const [sort, setSort] = useState<OrderSort>({ key: "createdAt", dir: "desc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [columns, setColumns] = useState<Record<string, boolean>>({ ...DEFAULT_COLUMNS });

  const [savedViews, setSavedViews] = useState<OrdersView[]>(() => (typeof window === "undefined" ? [] : loadViews()));
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [data, setData] = useState<Paged<Order> | null>(null);

  const api = useMemo<OrdersState>(() => {
    const saveView = (name: string) => {
      const view: OrdersView = { id: uid("view"), name, query, sort, columns };
      const next = [view, ...savedViews];
      setSavedViews(next);
      persistViews(next);
    };
    const applyView = (id: string) => {
      const v = savedViews.find(x => x.id === id);
      if (!v) return;
      setQuery(v.query);
      setSort(v.sort);
      setColumns(v.columns);
      setPage(1);
    };
    const deleteView = (id: string) => {
      const next = savedViews.filter(x => x.id !== id);
      setSavedViews(next);
      persistViews(next);
    };

    return {
      repo: repoRef.current!,
      query, setQuery,
      sort, setSort,
      page, setPage,
      pageSize, setPageSize,
      columns, setColumns,
      savedViews, saveView, applyView, deleteView,
      selectedIds, setSelectedIds,
      data, setData,
    };
  }, [query, sort, page, pageSize, columns, savedViews, selectedIds, data]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useOrders() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useOrders OrdersProvider ichida ishlatilishi kerak");
  return v;
}
