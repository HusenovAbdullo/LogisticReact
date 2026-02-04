import type { AdvancedFilterConfig } from "../_components/DataTable";
import { hasAnyLocation, optionsFromRows } from "../_lib/filterUtils";

export type AnyRow = {
  id: string;
  kind: "Admin" | "Xodim" | "Foydalanuvchi" | "Magazin" | "Sklad" | "Ofis";
  title: string;
  phone?: string;
  status?: string;
  address?: string;
  avatarUrl?: string;
  lat?: number;
  lng?: number;
  trackPoints?: { lat: number; lng: number; at: string }[];
  raw?: any;
};

export const umumiySearchKeys: (keyof AnyRow)[] = ["title", "phone", "status", "address", "kind", "id"];

export function getUmumiyAdvancedFilter(rows: AnyRow[]): AdvancedFilterConfig<AnyRow> {
  const kindOptions = optionsFromRows(rows, (r) => r.kind);
  const statusOptions = optionsFromRows(rows, (r) => r.status ?? "");

  return {
    storageKey: "umumiy__advancedFilter",
    title: "Umumiy filtri",
    schema: [
      {
        key: "q",
        label: "Umumiy qidiruv",
        type: "text",
        get: (r) => `${r.kind ?? ""} ${r.title ?? ""} ${r.phone ?? ""} ${r.status ?? ""} ${r.address ?? ""} ${r.id ?? ""}`,
      },
      { key: "title", label: "Nomi / F.I.Sh", type: "text" },
      { key: "phone", label: "Telefon", type: "text" },
      { key: "address", label: "Manzil", type: "text" },
      { key: "id", label: "ID", type: "text" },

      { key: "kind", label: "Tur", type: "select", options: kindOptions },
      { key: "status", label: "Status", type: "select", options: statusOptions },

      {
        key: "hasLocation",
        label: "Lokatsiya bor",
        type: "toggle",
        trueLabel: "Faqat lokatsiyali",
        get: (r) => hasAnyLocation(r),
      },
    ],
    initial: {},
  };
}
