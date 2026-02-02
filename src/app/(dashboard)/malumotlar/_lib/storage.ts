"use client";

export type Id = string;

export function uid(prefix = "id"): Id {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Tiny localStorage JSON store.
 * - Client-side only (safe for Next.js App Router)
 * - Namespaces by key
 */
export const Store = {
  read<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;
    const parsed = safeParse<T>(window.localStorage.getItem(key));
    return parsed ?? fallback;
  },

  write<T>(key: string, value: T) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, JSON.stringify(value));
  },

  clear(key: string) {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
  },
};
