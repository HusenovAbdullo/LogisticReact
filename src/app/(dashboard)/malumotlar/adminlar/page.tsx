"use client";

import React, { useCallback, useMemo, useState } from "react";
import CrudPageClient from "../_components/CrudPageClient";
import { useCrudStore } from "../_lib/useCrud";
import { base, nowIso } from "../_lib/seed";
import type { Admin } from "../_lib/types";

/**
 * Admin type’ni buzmaymiz.
 * Page darajasida kengaytiramiz.
 *
 * ✅ MUHIM:
 * Ko‘rish oynasidagi “Xarita” bo‘limi ko‘pincha CrudPageClient ichida
 * `latitude/longitude` (yoki `lat/lng`) fieldlariga qarab ochiladi.
 * Shuning uchun biz ikkisini ham saqlaymiz: lat/lng + latitude/longitude.
 */
type AdminRow = Admin & {
  avatarUrl?: string;

  /** Multi role (tanlanadigan) */
  roles?: string[];

  /** Legacy text (orqaga moslik) */
  rolesText?: string;

  address?: string;
  activeAt?: string;

  /** map coords (for UI) */
  lat?: number;
  lng?: number;

  /** map coords (for CrudPageClient compatibility) */
  latitude?: number;
  longitude?: number;
};

const ROLE_OPTIONS = ["SuperAdmin", "Admin", "Manager", "Operator"] as const;

function toNum(v: any): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function uniq(arr: string[]) {
  return Array.from(new Set(arr.filter(Boolean)));
}

/**
 * ✅ Barchasini bitta joyda normalizatsiya:
 * - roles[] (yangi)
 * - rolesText (legacy)
 * - role (asosiy)
 */
function normalizeRoles(row: Partial<AdminRow>): string[] {
  const fromArr = Array.isArray((row as any).roles)
    ? (row as any).roles.map((x: any) => String(x).trim()).filter(Boolean)
    : [];

  const rolesText = String((row as any).rolesText ?? "").trim();
  const fromText = rolesText
    ? rolesText
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
    : [];

  const legacyRole = String((row as any).role ?? "").trim();

  return uniq([...fromArr, ...fromText, ...(legacyRole ? [legacyRole] : [])]);
}

function rolesToText(arr: string[]) {
  return uniq(arr).join(", ");
}

function seed(): AdminRow[] {
  const mk = (
    fullName: string,
    role: any,
    phone: string,
    email: string,
    avatarUrl: string,
    roles: string[],
    address: string,
    activeAt: string,
    lat: number,
    lng: number,
    status: any = "active"
  ): AdminRow =>
    ({
      ...base("admin"),
      fullName,
      role,
      phone,
      email,
      status,

      avatarUrl,

      // ✅ yangi (tanlanadigan)
      roles,

      // ✅ legacy (qidiruv/compat uchun)
      rolesText: rolesToText(roles),

      address,
      activeAt,

      // ✅ map coords (ikki variant)
      lat,
      lng,
      latitude: lat,
      longitude: lng,
    } as any);

  return [
    mk(
      "Husenov Abdullo",
      "SuperAdmin",
      "+998 90 000 00 00",
      "abdullo@example.com",
      "https://i.pravatar.cc/100?img=12",
      ["SuperAdmin", "Manager"],
      "Toshkent shahar, Yunusobod tumani, 2-daha, 29-dom",
      "2026-01-10T10:30:00.000Z",
      41.3333,
      69.2833,
      "active"
    ),
    mk(
      "Islomov Aziz",
      "Admin",
      "+998 91 111 11 11",
      "aziz@example.com",
      "https://i.pravatar.cc/100?img=32",
      ["Admin", "Operator"],
      "Buxoro viloyati, G‘ijduvon tumani, Amirobod MFY",
      "2025-12-18T08:15:00.000Z",
      40.099,
      64.683,
      "active"
    ),
  ];
}

function fmtDateTime(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function OSMEmbed({ lat, lng }: { lat?: number; lng?: number }) {
  const la = toNum(lat);
  const lo = toNum(lng);

  if (la == null || lo == null) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        Koordinata kiritilmagan.
      </div>
    );
  }

  const delta = 0.01;
  const left = lo - delta;
  const right = lo + delta;
  const top = la + delta;
  const bottom = la - delta;

  const src =
    `https://www.openstreetmap.org/export/embed.html?bbox=` +
    `${encodeURIComponent(left)},${encodeURIComponent(bottom)},${encodeURIComponent(right)},${encodeURIComponent(top)}` +
    `&layer=mapnik&marker=${encodeURIComponent(la)},${encodeURIComponent(lo)}`;

  const link = `https://www.openstreetmap.org/?mlat=${la}&mlon=${lo}#map=16/${la}/${lo}`;

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <iframe title="OpenStreetMap" src={src} className="h-[260px] w-full" loading="lazy" />
      </div>

      <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
        <div>
          Lat: <span className="font-semibold text-slate-700">{la}</span> , Lng:{" "}
          <span className="font-semibold text-slate-700">{lo}</span>
        </div>

        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700 hover:bg-slate-200"
        >
          Xaritada ochish
        </a>
      </div>
    </div>
  );
}

export default function Page() {
  const seedFn = useCallback(seed, []);
  const { ready, items, api } = useCrudStore<AdminRow>("malumotlar_adminlar", seedFn);

  // =========================
  // FILTER
  // =========================
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    q: "",
    status: "" as "" | "active" | "blocked",
    primaryRole: "" as "" | "SuperAdmin" | "Admin",
    roles: [] as string[],
    activeFrom: "",
    activeTo: "",
  });

  const filteredRows = useMemo(() => {
    let out = items ?? [];

    const q = filters.q.trim().toLowerCase();
    if (q) {
      out = out.filter((r) => {
        const roles = normalizeRoles(r).join(" ");
        const blob = [
          (r as any).fullName,
          (r as any).phone,
          (r as any).email,
          (r as any).status,
          (r as any).role,
          (r as any).rolesText,
          roles,
          (r as any).address,
          (r as any).activeAt,
          String((r as any).lat ?? (r as any).latitude ?? ""),
          String((r as any).lng ?? (r as any).longitude ?? ""),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return blob.includes(q);
      });
    }

    if (filters.status) {
      out = out.filter((r) => String((r as any).status) === filters.status);
    }

    if (filters.primaryRole) {
      out = out.filter((r) => String((r as any).role) === filters.primaryRole);
    }

    if (filters.roles.length) {
      out = out.filter((r) => {
        const have = normalizeRoles(r);
        return filters.roles.some((x) => have.includes(x));
      });
    }

    const fromMs = filters.activeFrom ? new Date(filters.activeFrom).getTime() : NaN;
    const toMs = filters.activeTo ? new Date(filters.activeTo).getTime() : NaN;

    if (!Number.isNaN(fromMs)) {
      out = out.filter((r) => {
        const ms = r.activeAt ? new Date(r.activeAt).getTime() : NaN;
        return !Number.isNaN(ms) && ms >= fromMs;
      });
    }
    if (!Number.isNaN(toMs)) {
      out = out.filter((r) => {
        const ms = r.activeAt ? new Date(r.activeAt).getTime() : NaN;
        return !Number.isNaN(ms) && ms <= toMs;
      });
    }

    return out;
  }, [items, filters]);

  // =========================
  // TABLE COLUMNS
  // =========================
  const columns = useMemo(
    () => [
      {
        key: "avatarUrl",
        header: "",
        render: (r: AdminRow) => (
          <div className="flex items-center">
            <img
              src={(r as any).avatarUrl || "https://via.placeholder.com/80"}
              alt={(r as any).fullName || "avatar"}
              className="h-10 w-10 rounded-2xl object-cover ring-1 ring-slate-200"
            />
          </div>
        ),
      },
      {
        key: "fullName",
        header: "F.I.Sh",
        render: (r: AdminRow) => (
          <div className="min-w-0">
            <div className="truncate font-medium text-slate-900">{(r as any).fullName}</div>
            <div className="truncate text-xs text-slate-500">{(r as any).email ?? "-"}</div>
          </div>
        ),
      },
      {
        key: "roles",
        header: "Rollar",
        render: (r: AdminRow) => {
          const roles = normalizeRoles(r);
          return (
            <div className="flex flex-wrap gap-1">
              {roles.length ? (
                roles.map((x) => (
                  <span
                    key={x}
                    className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700"
                  >
                    {x}
                  </span>
                ))
              ) : (
                <span className="text-slate-400">-</span>
              )}
            </div>
          );
        },
        hideOnMobile: true,
      },
      {
        key: "phone",
        header: "Telefon",
        render: (r: AdminRow) => (r as any).phone ?? "-",
      },
      {
        key: "address",
        header: "Manzil",
        render: (r: AdminRow) => (
          <span className="text-slate-700">{(r as any).address ?? "-"}</span>
        ),
        hideOnMobile: true,
      },
      {
        key: "activeAt",
        header: "Aktiv bo‘lgan",
        render: (r: AdminRow) => (
          <span className="text-slate-700">{fmtDateTime((r as any).activeAt)}</span>
        ),
        hideOnMobile: true,
      },
      {
        key: "status",
        header: "Holat",
        render: (r: AdminRow) => (
          <span
            className={[
              "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold",
              String((r as any).status) === "active"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-rose-100 text-rose-700",
            ].join(" ")}
          >
            {(r as any).status}
          </span>
        ),
      },
    ],
    []
  );

  // =========================
  // FORM FIELDS (Create/Edit)
  // =========================
  const fields = useMemo(
    () =>
      [
        { key: "fullName", label: "F.I.Sh", placeholder: "Masalan: Husenov Abdullo", required: true },
        { key: "phone", label: "Telefon", placeholder: "+998 ...", type: "tel" },
        { key: "email", label: "Email", placeholder: "mail@example.com", type: "email" },

        { key: "avatarUrl", label: "Rasm (URL)", placeholder: "https://...", type: "text" },
        { key: "address", label: "Manzil", placeholder: "Toshkent shahar, ...", type: "text" },

        { key: "activeAt", label: "Aktiv bo‘lgan vaqti", type: "datetime-local" },

        { key: "lat", label: "Latitude", placeholder: "41.33", type: "number" },
        { key: "lng", label: "Longitude", placeholder: "69.28", type: "number" },

        {
          key: "role",
          label: "Asosiy roli",
          type: "select",
          options: [
            { value: "SuperAdmin", label: "SuperAdmin" },
            { value: "Admin", label: "Admin" },
          ],
        },

        /**
         * ✅ Endi yoziladigan emas — tanlanadigan:
         * CrudPageClient select’ni multiple bilan qo‘llasa ishlaydi.
         */
        {
          key: "roles",
          label: "Qo‘shimcha rollar (bir nechta)",
          type: "select",
          multiple: true,
          options: ROLE_OPTIONS.map((r) => ({ value: r, label: r })),
          placeholder: "Rollarni tanlang",
        },

        {
          key: "status",
          label: "Holat",
          type: "select",
          options: [
            { value: "active", label: "active" },
            { value: "blocked", label: "blocked" },
          ],
        },

        // legacy (orqaga moslik) — edit formda ko‘rsatmaymiz
        { key: "rolesText", label: "rolesText", hide: true },
        { key: "latitude", label: "latitude", hide: true },
        { key: "longitude", label: "longitude", hide: true },

        { key: "createdAt", label: "Yaratilgan", hide: true },
        { key: "updatedAt", label: "Yangilangan", hide: true },
        { key: "id", label: "ID", hide: true },
      ] as any,
    []
  );

  if (!ready) {
    return <div className="p-4 text-slate-600">Yuklanmoqda...</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          💡 Ko‘rish oynasida “Xarita” bo‘limi chiqishi uchun{" "}
          <span className="font-semibold">lat/lng</span> kiriting (biz{" "}
          <span className="font-semibold">latitude/longitude</span> ni ham avtomatik to‘ldiramiz).
        </div>

        <button
          onClick={() => setFilterOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Filter
          <span className="text-xs text-slate-400">
            ({filteredRows.length}/{items.length})
          </span>
        </button>
      </div>

      <CrudPageClient<AdminRow>
        title="Adminlar"
        description="Asosiy adminlar ro‘yxati"
        rows={filteredRows}
        columns={columns as any}
        searchKeys={[
          "fullName",
          "phone",
          "email",
          "role",
          "rolesText",
          "status",
          "address",
          "activeAt",
        ]}
        fields={fields as any}
        onCreate={(payload) => {
          const t = nowIso();

          // activeAt: datetime-local -> ISO
          let activeAt = (payload as any).activeAt;
          if (activeAt && typeof activeAt === "string" && !activeAt.endsWith("Z")) {
            const ms = new Date(activeAt).getTime();
            if (!Number.isNaN(ms)) activeAt = new Date(ms).toISOString();
          }

          const lat = toNum((payload as any).lat);
          const lng = toNum((payload as any).lng);

          // ✅ roles: CrudPageClient multiple select qaytarishi mumkin:
          // - string[]
          // - string (bitta)
          // - null
          const rawRoles = (payload as any).roles;
          const rolesArr = Array.isArray(rawRoles)
            ? rawRoles.map((x: any) => String(x).trim()).filter(Boolean)
            : rawRoles
            ? [String(rawRoles).trim()].filter(Boolean)
            : [];

          const mergedRoles = uniq([...rolesArr, String((payload as any).role ?? "").trim()].filter(Boolean));

          api.create({
            ...(payload as any),

            // roles storage
            roles: mergedRoles,
            rolesText: rolesToText(mergedRoles),

            // map coords (ikkisini ham set qilamiz)
            lat,
            lng,
            latitude: lat,
            longitude: lng,

            activeAt: activeAt || nowIso(),
            createdAt: t,
            updatedAt: t,
          } as any);
        }}
        onUpdate={(id, patch) => {
          const next: any = { ...(patch as any) };

          if (next.activeAt && typeof next.activeAt === "string" && !next.activeAt.endsWith("Z")) {
            const ms = new Date(next.activeAt).getTime();
            if (!Number.isNaN(ms)) next.activeAt = new Date(ms).toISOString();
          }

          // coords
          if ("lat" in next) next.lat = toNum(next.lat);
          if ("lng" in next) next.lng = toNum(next.lng);

          // ✅ lat/lng o‘zgarsa latitude/longitude ham sync bo‘lsin
          if ("lat" in next) next.latitude = next.lat;
          if ("lng" in next) next.longitude = next.lng;

          // ✅ roles update: rolesText ni ham sync qilamiz
          if ("roles" in next || "role" in next) {
            // existing row’dan ham qo‘shib normalizatsiya qilib yuboramiz
            const merged = normalizeRoles(next);
            next.roles = merged;
            next.rolesText = rolesToText(merged);
          }

          api.update(id, { ...next, updatedAt: nowIso() } as any);
        }}
        onRemove={(id) => api.remove(id)}
        detailsMap={(r) => {
          const roles = normalizeRoles(r);

          // ✅ map coords: qaysi biri to‘lgan bo‘lsa shuni ishlatamiz
          const la = (r as any).lat ?? (r as any).latitude;
          const lo = (r as any).lng ?? (r as any).longitude;

          return {
            "F.I.Sh": (r as any).fullName,
            "Telefon": (r as any).phone,
            "Email": (r as any).email,
            "Asosiy roli": (r as any).role,
            "Rollar (barchasi)": roles.join(", ") || "-",
            "Holat": (r as any).status,

            "Manzil": (r as any).address ?? "-",
            "Aktiv bo‘lgan vaqti": fmtDateTime((r as any).activeAt),

            // ✅ ikkisini ham ko‘rsatamiz (debug + moslik)
            "Latitude (lat)": (r as any).lat ?? "-",
            "Longitude (lng)": (r as any).lng ?? "-",
            "Latitude (legacy)": (r as any).latitude ?? "-",
            "Longitude (legacy)": (r as any).longitude ?? "-",

            // ✅ Xarita bo‘limi endi la/lo bo‘yicha ishlaydi
            Xarita: <OSMEmbed lat={la} lng={lo} />,

            "Rasm (URL)": (r as any).avatarUrl || "-",
            Yaratilgan: (r as any).createdAt,
            Yangilangan: (r as any).updatedAt,
            ID: (r as any).id,
          };
        }}
      />

      {/* FILTER MODAL */}
      {filterOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-extrabold text-slate-900">Filter</div>
                <div className="text-sm text-slate-500">
                  Ism, telefon, email, manzil, status, rol, aktiv vaqt va rollar bo‘yicha filtr
                </div>
              </div>

              <button
                onClick={() => setFilterOpen(false)}
                className="rounded-2xl px-3 py-2 text-slate-600 hover:bg-slate-100"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              <input
                value={filters.q}
                onChange={(e) => setFilters((s) => ({ ...s, q: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Qidirish: ism, tel, email, manzil, rol, status..."
              />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <select
                  value={filters.status}
                  onChange={(e) => setFilters((s) => ({ ...s, status: e.target.value as any }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                >
                  <option value="">Status: barchasi</option>
                  <option value="active">active</option>
                  <option value="blocked">blocked</option>
                </select>

                <select
                  value={filters.primaryRole}
                  onChange={(e) => setFilters((s) => ({ ...s, primaryRole: e.target.value as any }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                >
                  <option value="">Asosiy rol: barchasi</option>
                  <option value="SuperAdmin">SuperAdmin</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Aktiv bo‘lgan (dan)
                  </div>
                  <input
                    type="datetime-local"
                    value={filters.activeFrom}
                    onChange={(e) => setFilters((s) => ({ ...s, activeFrom: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Aktiv bo‘lgan (gacha)
                  </div>
                  <input
                    type="datetime-local"
                    value={filters.activeTo}
                    onChange={(e) => setFilters((s) => ({ ...s, activeTo: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Rollar (bir nechta tanlang)
                </div>

                <div className="flex flex-wrap gap-2">
                  {ROLE_OPTIONS.map((r) => {
                    const on = filters.roles.includes(r);
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() =>
                          setFilters((s) => ({
                            ...s,
                            roles: on ? s.roles.filter((x) => x !== r) : [...s.roles, r],
                          }))
                        }
                        className={[
                          "rounded-full px-3 py-1 text-sm font-semibold transition",
                          on ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                        ].join(" ")}
                      >
                        {r}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 text-xs text-slate-500">
                  Tanlangan rollardan bittasi bo‘lsa ham mos keladi.
                </div>
              </div>

              <div className="mt-2 flex items-center justify-end gap-2">
                <button
                  onClick={() =>
                    setFilters({
                      q: "",
                      status: "",
                      primaryRole: "",
                      roles: [],
                      activeFrom: "",
                      activeTo: "",
                    })
                  }
                  className="rounded-2xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Tozalash
                </button>

                <button
                  onClick={() => setFilterOpen(false)}
                  className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Qo‘llash
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
