"use client";

import { useEffect, useMemo, useState } from "react";
import type { Locale } from "./index";
import { loadDict } from "./index";

import uz from "./locales/uz.json"; // type manbasi
type Dict = typeof uz;

// "topbar.search_placeholder" kabi string union yaratamiz
type Join<K, P> = K extends string
  ? P extends string
    ? `${K}.${P}`
    : never
  : never;

type Paths<T> = T extends Record<string, any>
  ? {
      [K in keyof T & string]: T[K] extends Record<string, any>
        ? Join<K, Paths<T[K]>>
        : K;
    }[keyof T & string]
  : never;

export type I18nKey = Paths<Dict>;

function getByPath(obj: any, path: string) {
  return path.split(".").reduce((acc, k) => (acc ? acc[k] : undefined), obj);
}

function isLocale(v: any): v is Locale {
  return v === "uz" || v === "ru" || v === "en";
}

function resolveLocale(input?: Locale): Locale {
  if (input) return input;

  if (typeof window === "undefined") return "uz";

  try {
    const saved = localStorage.getItem("lang");
    if (isLocale(saved)) return saved;
  } catch {}

  return "uz";
}

// ✅ locale endi optional
export function useI18n(locale?: Locale) {
  const [dict, setDict] = useState<Dict>(uz); // fallback uz

  // ✅ locale ni doim safe qilib olamiz
  const activeLocale = useMemo(() => resolveLocale(locale), [locale]);

  useEffect(() => {
    let alive = true;

    loadDict(activeLocale).then((d) => {
      if (!alive) return;
      setDict(d as Dict);
    });

    return () => {
      alive = false;
    };
  }, [activeLocale]);

  const t = useMemo(() => {
    return (key: I18nKey) => {
      const hit = getByPath(dict, key);
      return typeof hit === "string" ? hit : key;
    };
  }, [dict]);

  return { t, dict, locale: activeLocale };
}
