import type { AdvancedFilterConfig } from "../_components/DataTable";
import type { User } from "../_lib/types";
import { hasAnyLocation, optionsFromRows } from "../_lib/filterUtils";

export type UserRow = User & {
  avatarUrl?: string;
  telegram?: string;
  note?: string;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
};

export const userSearchKeys: (keyof UserRow)[] = ["fullName", "phone", "type", "address", "status", "telegram", "note", "id"];

export function getUserAdvancedFilter(rows: UserRow[]): AdvancedFilterConfig<UserRow> {
  const typeOptions = optionsFromRows(rows, (r) => r.type, { sender: "Sender", receiver: "Receiver" });
  const statusOptions = optionsFromRows(rows, (r) => r.status, { active: "Faol", blocked: "Bloklangan" });

  return {
    storageKey: "foydalanuvchilar__advancedFilter",
    title: "Foydalanuvchilar filtri",
    description: "Matn bo‘yicha izlash, select, sana oralig‘i va lokatsiya bo‘yicha filtr.",
    schema: [
      {
        key: "q",
        label: "Umumiy qidiruv",
        type: "text",
        placeholder: "Ism / telefon / manzil / telegram...",
        get: (r) => `${r.fullName ?? ""} ${r.phone ?? ""} ${r.address ?? ""} ${r.telegram ?? ""} ${r.status ?? ""} ${r.type ?? ""} ${r.id ?? ""}`,
      },
      { key: "fullName", label: "F.I.Sh", type: "text" },
      { key: "phone", label: "Telefon", type: "text" },
      { key: "address", label: "Manzil", type: "text" },
      { key: "telegram", label: "Telegram", type: "text" },
      { key: "note", label: "Izoh", type: "text" },

      { key: "type", label: "Turi", type: "select", options: typeOptions },
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
