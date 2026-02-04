import type { AdvancedFilterConfig } from "../_components/DataTable";
import type { Employee } from "../_lib/types";
import { hasAnyLocation, optionsFromRows } from "../_lib/filterUtils";

export type EmployeeRow = Employee & {
  avatarUrl?: string;
  address?: string;
  telegram?: string;
  note?: string;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
};

export const employeeSearchKeys: (keyof EmployeeRow)[] = [
  "fullName",
  "phone",
  "position",
  "office",
  "address",
  "telegram",
  "status",
  "note",
  "id",
];

export function getEmployeeAdvancedFilter(rows: EmployeeRow[]): AdvancedFilterConfig<EmployeeRow> {
  const statusOptions = optionsFromRows(rows, (r) => r.status, { active: "Faol", inactive: "Nofaol" });
  const officeOptions = optionsFromRows(rows, (r) => r.office ?? "");
  const positionOptions = optionsFromRows(rows, (r) => r.position ?? "");

  return {
    storageKey: "xodimlar__advancedFilter",
    title: "Xodimlar filtri",
    schema: [
      { key: "fullName", label: "F.I.Sh", type: "text" },
      { key: "phone", label: "Telefon", type: "text" },
      { key: "address", label: "Manzil", type: "text" },
      { key: "telegram", label: "Telegram", type: "text" },
      { key: "note", label: "Izoh", type: "text" },

      // Lokatsiya (ixtiyoriy) — kerak bo‘lsa diapazon bilan qidiring
      { key: "lat", label: "Latitude", type: "numberRange", minLabel: "Min", maxLabel: "Max", get: (r) => (r as any).lat ?? (r as any).latitude },
      { key: "lng", label: "Longitude", type: "numberRange", minLabel: "Min", maxLabel: "Max", get: (r) => (r as any).lng ?? (r as any).longitude },

      { key: "position", label: "Lavozim", type: "select", options: positionOptions },
      { key: "office", label: "Ofis", type: "select", options: officeOptions },
      { key: "status", label: "Status", type: "select", options: statusOptions },

      {
        key: "hasLocation",
        label: "Lokatsiya bor",
        type: "toggle",
        trueLabel: "Faqat lokatsiyali",
        get: (r) => hasAnyLocation(r),
      },

      { key: "createdAt", label: "Yaratilgan", type: "dateRange" },
      { key: "updatedAt", label: "Yangilangan", type: "dateRange" },
      { key: "id", label: "ID", type: "text" },
    ],
    initial: {},
  };
}
