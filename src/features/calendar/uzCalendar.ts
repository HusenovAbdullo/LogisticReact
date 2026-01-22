// src/features/calendar/uzCalendar.ts
import { UZ_CALENDAR_2026 } from "@/shared/config/uz-calendar-2026";

export const UZ_MONTHS = [
  "Yanvar",
  "Fevral",
  "Mart",
  "Aprel",
  "May",
  "Iyun",
  "Iyul",
  "Avgust",
  "Sentabr",
  "Oktabr",
  "Noyabr",
  "Dekabr",
];

export const UZ_WEEKDAYS_SHORT = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"]; // Mon..Sun

export function formatDMY(iso: string) {
  // "2026-01-21" -> "21.01.2026"
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

export function formatLongUz(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("uz-UZ", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function formatWeekdayUz(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("uz-UZ", { weekday: "long" });
}

export function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function buildMonthGrid(year: number, month0: number) {
  // month0: 0..11
  const first = new Date(year, month0, 1);
  const last = new Date(year, month0 + 1, 0);
  const daysInMonth = last.getDate();

  // JS getDay(): Sun=0..Sat=6 -> bizga Mon=0..Sun=6
  const jsDow = first.getDay(); // 0..6
  const offset = (jsDow + 6) % 7; // Mon-based

  const cells: Array<null | { iso: string; day: number }> = [];
  for (let i = 0; i < offset; i++) cells.push(null);

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month0, day);
    cells.push({ iso: toISODate(d), day });
  }

  // 6 qatorga chiroyli to‘ldirib qo‘yamiz (42 cell)
  while (cells.length < 42) cells.push(null);

  return cells;
}

export function getUzWorkCalendarMeta(iso: string) {
  const d = new Date(iso + "T00:00:00");
  const jsDow = d.getDay(); // 0..6
  const isWeekend = jsDow === 0 || jsDow === 6; // yakshanba/shanba (5-kunlik ish haftasi uchun)

  const hit = UZ_CALENDAR_2026[iso];
  const isHoliday = hit?.kind === "holiday";
  const isExtraDayOff = hit?.kind === "extra_day_off";

  // label: sababi (bayram nomi / dam olish)
  let label: string | null = null;
  if (hit) label = hit.title;
  else if (isWeekend) label = jsDow === 6 ? "Shanba" : "Yakshanba";

  return {
    isWeekend,
    isHoliday,
    isExtraDayOff,
    label,
    sourceNote: hit?.note ?? null,
  };
}
