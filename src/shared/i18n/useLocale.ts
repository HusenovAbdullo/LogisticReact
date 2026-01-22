// src/shared/i18n/useLocale.ts
"use client";

import { useCallback, useEffect, useState } from "react";
import type { Locale } from "./index";

const STORAGE_KEY = "lang";

function isLocale(v: unknown): v is Locale {
  return v === "uz" || v === "ru" || v === "en";
}

function readStoredLocale(): Locale {
  if (typeof window === "undefined") return "uz";
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (isLocale(v)) return v;
  } catch {}
  return "uz";
}

function applyDocumentLang(locale: Locale) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = locale;
}

/**
 * One source of truth:
 * - localStorage("lang")
 * - document.documentElement.lang
 * - same-tab notify: window "localechange"
 */
export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>(() => readStoredLocale());

  useEffect(() => {
    applyDocumentLang(locale);
  }, [locale]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      if (isLocale(e.newValue)) setLocaleState(e.newValue);
    };

    const onLocal = () => {
      setLocaleState(readStoredLocale());
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("localechange", onLocal as EventListener);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("localechange", onLocal as EventListener);
    };
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    applyDocumentLang(next);

    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}

    // same-tab subscribers
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("localechange"));
    }
  }, []);

  return { locale, setLocale };
}
