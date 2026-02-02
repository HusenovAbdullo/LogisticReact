"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Store, uid } from "./storage";

export function useCrudStore<T extends { id: string }>(
  storageKey: string,
  seed: () => T[]
) {
  const [items, setItems] = useState<T[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initial = Store.read<T[]>(storageKey, []);
    if (initial.length === 0) {
      const s = seed();
      Store.write(storageKey, s);
      setItems(s);
    } else {
      setItems(initial);
    }
    setReady(true);
  }, [storageKey, seed]);

  useEffect(() => {
    if (!ready) return;
    Store.write(storageKey, items);
  }, [items, ready, storageKey]);

  const api = useMemo(() => {
    return {
      list: () => items,
      get: (id: string) => items.find((x) => x.id === id) ?? null,
      create: (payload: Omit<T, "id"> & { id?: string }) => {
        const id = payload.id ?? uid(storageKey);
        const next = [{ ...(payload as T), id }, ...items];
        setItems(next);
        return id;
      },
      update: (id: string, patch: Partial<T>) => {
        const next = items.map((x) => (x.id === id ? { ...x, ...patch } : x));
        setItems(next);
      },
      remove: (id: string) => {
        setItems(items.filter((x) => x.id !== id));
      },
      reset: () => {
        const s = seed();
        Store.write(storageKey, s);
        setItems(s);
      },
    };
  }, [items, seed, storageKey]);

  return { ready, items, setItems, api };
}
