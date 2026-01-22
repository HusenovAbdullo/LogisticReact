// src/shared/config/uz-calendar-2026.ts

export type UzCalendarDayKind = "holiday" | "extra_day_off";
export type UzCalendarDayMeta = { kind: UzCalendarDayKind; title: string; note?: string };

export const UZ_CALENDAR_2026: Record<string, UzCalendarDayMeta> = {
  // Yangi yil
  "2026-01-01": { kind: "holiday", title: "Yangi yil" },
  "2026-01-02": {
    kind: "holiday",
    title: "Yangi yil (qo‘shimcha dam olish kuni)",
  },

  // 8 mart + ko‘chirilgan dam olish
  "2026-03-08": { kind: "holiday", title: "Xalqaro xotin-qizlar kuni" },
  "2026-03-09": {
    kind: "extra_day_off",
    title: "8 mart uchun qo‘shimcha dam olish kuni",
  },

  // Ramazon hayiti (taxminiy)
  "2026-03-20": {
    kind: "holiday",
    title: "Ramazon hayiti (Ro‘za hayit)",
    note: "Sana rasmiy e’lon bilan aniqlashtiriladi.",
  },

  // Navro‘z + qo‘shimcha dam olish
  "2026-03-21": { kind: "holiday", title: "Navro‘z bayrami" },
  "2026-03-23": {
    kind: "extra_day_off",
    title: "Navro‘z uchun qo‘shimcha dam olish kuni",
  },

  // 9 may + qo‘shimcha dam olish
  "2026-05-09": { kind: "holiday", title: "Xotira va qadrlash kuni" },
  "2026-05-11": {
    kind: "extra_day_off",
    title: "9 may uchun qo‘shimcha dam olish kuni",
  },

  // Qurbon hayiti (taxminiy) + uzaytirilgan dam olish
  "2026-05-27": {
    kind: "holiday",
    title: "Qurbon hayiti",
    note: "Sana rasmiy e’lon bilan aniqlashtiriladi.",
  },
  "2026-05-28": {
    kind: "extra_day_off",
    title: "Qurbon hayiti (qo‘shimcha dam olish kuni)",
  },
  "2026-05-29": {
    kind: "extra_day_off",
    title: "Qurbon hayiti (qo‘shimcha dam olish kuni)",
  },

  // Mustaqillik atrofidagi uzoq dam olish (rasmiy ish vaqti kalendari)
  "2026-08-31": {
    kind: "extra_day_off",
    title: "Mustaqillik bayrami oldidan qo‘shimcha dam olish kuni",
  },
  "2026-09-01": { kind: "holiday", title: "Mustaqillik kuni" },

  // O‘qituvchi va murabbiylar kuni
  "2026-10-01": { kind: "holiday", title: "O‘qituvchi va murabbiylar kuni" },

  // Konstitutsiya kuni
  "2026-12-08": { kind: "holiday", title: "Konstitutsiya kuni" },
}

// Helper: quick lookup (optional)
export function getUzCalendarMeta(iso: string): UzCalendarDayMeta | undefined {
  return UZ_CALENDAR_2026[iso];
}
