import type { AdvancedFilterConfig } from "../_components/DataTable";
import type { Admin } from "../_lib/types";
import { hasAnyLocation, optionsFromRows } from "../_lib/filterUtils";

export type AdminRow = Admin & {
  avatarUrl?: string;
  roles?: string[];
  rolesText?: string;
  address?: string;
  activeAt?: string;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
};

export const adminSearchKeys: (keyof AdminRow)[] = [
  "id",
  "fullName",
  "phone",
  "email",
  "role",
  "status",
  "rolesText",
  "address",
  "activeAt",
];

export function getAdminAdvancedFilter(rows: AdminRow[]): AdvancedFilterConfig<AdminRow> {
  const roleOptions = optionsFromRows(rows, (r) => r.role, {
    SuperAdmin: "SuperAdmin",
    Admin: "Admin",
  });

  const statusOptions = optionsFromRows(rows, (r) => r.status, {
    active: "Faol",
    blocked: "Bloklangan",
  });

  const rolesOptions = optionsFromRows(
    rows,
    (r) => (Array.isArray(r.roles) ? r.roles : r.rolesText ? String(r.rolesText).split(",").map((x) => x.trim()) : []),
    {
      SuperAdmin: "SuperAdmin",
      Admin: "Admin",
      Manager: "Manager",
      Operator: "Operator",
      Courier: "Courier",
    }
  );

  return {
    storageKey: "adminlar__advancedFilter",
    title: "Adminlar filtri",
    description: "Maydon bo‘yicha aniq izlash, sana oralig‘i, multi-role va boshqa parametrlar.",
    schema: [
      {
        key: "q",
        label: "Umumiy qidiruv",
        type: "text",
        placeholder: "Ism / telefon / email / rol / status...",
        get: (r) => `${r.fullName ?? ""} ${r.phone ?? ""} ${r.email ?? ""} ${r.role ?? ""} ${r.status ?? ""} ${r.rolesText ?? ""} ${r.address ?? ""} ${r.id ?? ""}`,
      },
      { key: "fullName", label: "F.I.Sh", type: "text", placeholder: "Masalan: Abdullo" },
      { key: "phone", label: "Telefon", type: "text", placeholder: "+998..." },
      { key: "email", label: "Email", type: "text", placeholder: "user@mail.com" },
      { key: "address", label: "Manzil", type: "text" },
      { key: "id", label: "ID", type: "text" },

      { key: "role", label: "Asosiy rol", type: "select", options: roleOptions },
      { key: "status", label: "Status", type: "select", options: statusOptions },

      {
        key: "roles",
        label: "Rol (multi)",
        type: "multi",
        options: rolesOptions,
        get: (r) => r.roles ?? (r.rolesText ? r.rolesText.split(",").map((x) => x.trim()) : []),
      },

      {
        key: "hasLocation",
        label: "Lokatsiya bor",
        type: "toggle",
        trueLabel: "Faqat lokatsiyali",
        get: (r) => hasAnyLocation(r),
      },

      { key: "createdAt", label: "Yaratilgan sana", type: "dateRange" },
      { key: "updatedAt", label: "Yangilangan sana", type: "dateRange" },
      { key: "activeAt", label: "Oxirgi faollik", type: "dateRange" },
    ],
    initial: {},
  };
}
