import type { AdvancedFilterConfig } from "../_components/DataTable";
import type { Warehouse } from "../_lib/types";
import { hasAnyLocation, optionsFromRows } from "../_lib/filterUtils";

export type WarehouseRow = Warehouse & {
  avatarUrl?: string;
  telegram?: string;
  note?: string;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  trackPoints?: Array<{ lat: number; lng: number; at: string | Date }>;
};

export const warehouseSearchKeys: (keyof WarehouseRow)[] = ["name", "manager", "phone", "address", "status", "telegram", "note", "id"];

export function getWarehouseAdvancedFilter(rows: WarehouseRow[]): AdvancedFilterConfig<WarehouseRow> {
  const statusOptions = optionsFromRows(rows, (r) => r.status, { active: "Faol", inactive: "Nofaol" });

  return {
    storageKey: "skladlar__advancedFilter",
    title: "Skladlar filtri",
    schema: [
      {
        key: "q",
        label: "Umumiy qidiruv",
        type: "text",
        get: (r) => `${r.name ?? ""} ${r.manager ?? ""} ${r.phone ?? ""} ${r.address ?? ""} ${r.status ?? ""} ${r.telegram ?? ""} ${r.id ?? ""}`,
      },
      { key: "name", label: "Nomi", type: "text" },
      { key: "manager", label: "Mas'ul", type: "text" },
      { key: "phone", label: "Telefon", type: "text" },
      { key: "address", label: "Manzil", type: "text" },
      { key: "telegram", label: "Telegram", type: "text" },
      { key: "note", label: "Izoh", type: "text" },
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
