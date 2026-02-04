"use client";

import React, { useEffect, useMemo, useState } from "react";

export type AdminFilters = {
  // Global search
  q: string;

  // Per-field text
  fullName: string;
  phone: string;
  email: string;
  address: string;
  id: string;
  avatarUrl: string;

  // Selects
  status: string;
  mainRole: string;
  roleAny: string;

  // Toggles
  hasLocation: boolean;

  // Date ranges (ISO or yyyy-mm-dd)
  activeFrom: string;
  activeTo: string;
  createdFrom: string;
  createdTo: string;
  updatedFrom: string;
  updatedTo: string;

  // Number ranges
  latMin: string;
  latMax: string;
  lngMin: string;
  lngMax: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  value: AdminFilters;
  onChange: (next: AdminFilters) => void;
  roleOptions: string[];
  statusOptions: string[];
  mainRoleOptions: string[];
};

function clsx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-semibold text-slate-600">{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  placeholder = "Barchasi",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-semibold text-slate-600">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
      >
        <option value="">{placeholder}</option>
        {options.map((x) => (
          <option key={x} value={x}>
            {x}
          </option>
        ))}
      </select>
    </label>
  );
}

function RangeRow({
  label,
  from,
  to,
  onFrom,
  onTo,
  type,
  fromLabel = "Dan",
  toLabel = "Gacha",
  placeholderFrom,
  placeholderTo,
}: {
  label: string;
  from: string;
  to: string;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
  type: "date" | "number";
  fromLabel?: string;
  toLabel?: string;
  placeholderFrom?: string;
  placeholderTo?: string;
}) {
  return (
    <div className="block">
      <div className="mb-1 text-xs font-semibold text-slate-600">{label}</div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="block">
          <div className="mb-1 text-[11px] font-semibold text-slate-500">{fromLabel}</div>
          <input
            type={type}
            value={from}
            onChange={(e) => onFrom(e.target.value)}
            placeholder={placeholderFrom}
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
          />
        </label>
        <label className="block">
          <div className="mb-1 text-[11px] font-semibold text-slate-500">{toLabel}</div>
          <input
            type={type}
            value={to}
            onChange={(e) => onTo(e.target.value)}
            placeholder={placeholderTo}
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
          />
        </label>
      </div>
    </div>
  );
}

export default function FilterModal({
  open,
  onClose,
  value,
  onChange,
  roleOptions,
  statusOptions,
  mainRoleOptions,
}: Props) {
  const [draft, setDraft] = useState<AdminFilters>(value);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const hasAny = useMemo(() => {
    const v = draft;
    return Object.entries(v).some(([k, val]) => {
      if (k === "hasLocation") return Boolean(val);
      return String(val ?? "").trim() !== "";
    });
  }, [draft]);

  const reset = () => {
    setDraft({
      q: "",
      fullName: "",
      phone: "",
      email: "",
      address: "",
      id: "",
      avatarUrl: "",
      status: "",
      mainRole: "",
      roleAny: "",
      hasLocation: false,
      activeFrom: "",
      activeTo: "",
      createdFrom: "",
      createdTo: "",
      updatedFrom: "",
      updatedTo: "",
      latMin: "",
      latMax: "",
      lngMin: "",
      lngMax: "",
    });
  };

  const apply = () => {
    onChange(draft);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute inset-0 bg-slate-950/40"
      />

      {/* Panel */}
      <div className="absolute inset-0 flex items-end justify-center p-2 sm:items-center sm:p-4">
        <div
          role="dialog"
          aria-modal="true"
          className="w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-6">
            <div>
              <div className="text-sm font-semibold text-slate-900">Mukammal filter</div>
              <div className="text-xs text-slate-500">
                Qidiruv va barcha maydonlar bo‘yicha filtrlash
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Yopish
            </button>
          </div>

          {/* Body */}
          <div className="max-h-[75vh] overflow-auto px-4 py-4 sm:px-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Global search */}
              <div className="lg:col-span-2">
                <Input
                  label="Qidirish (hamma maydonlarda)"
                  value={draft.q}
                  onChange={(v) => setDraft((p) => ({ ...p, q: v }))}
                  placeholder="Masalan: Husenov, +998, SuperAdmin, Yunusobod..."
                />
              </div>

              {/* Text fields */}
              <Input
                label="F.I.Sh"
                value={draft.fullName}
                onChange={(v) => setDraft((p) => ({ ...p, fullName: v }))}
                placeholder="Husenov"
              />
              <Input
                label="Telefon"
                value={draft.phone}
                onChange={(v) => setDraft((p) => ({ ...p, phone: v }))}
                placeholder="+998"
              />
              <Input
                label="Email"
                value={draft.email}
                onChange={(v) => setDraft((p) => ({ ...p, email: v }))}
                placeholder="example@mail.com"
              />
              <Input
                label="Manzil"
                value={draft.address}
                onChange={(v) => setDraft((p) => ({ ...p, address: v }))}
                placeholder="Yunusobod"
              />
              <Input
                label="ID"
                value={draft.id}
                onChange={(v) => setDraft((p) => ({ ...p, id: v }))}
                placeholder="admin_..."
              />
              <Input
                label="Rasm URL"
                value={draft.avatarUrl}
                onChange={(v) => setDraft((p) => ({ ...p, avatarUrl: v }))}
                placeholder="https://"
              />

              {/* Selects */}
              <Select
                label="Holat"
                value={draft.status}
                onChange={(v) => setDraft((p) => ({ ...p, status: v }))}
                options={statusOptions}
              />
              <Select
                label="Asosiy roli"
                value={draft.mainRole}
                onChange={(v) => setDraft((p) => ({ ...p, mainRole: v }))}
                options={mainRoleOptions}
              />
              <Select
                label="Rollar (barchasi)"
                value={draft.roleAny}
                onChange={(v) => setDraft((p) => ({ ...p, roleAny: v }))}
                options={roleOptions}
              />

              {/* Toggle */}
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div>
                  <div className="text-xs font-semibold text-slate-700">Lokatsiya</div>
                  <div className="text-xs text-slate-500">Faqat koordinatasi borlarini ko‘rsatish</div>
                </div>
                <button
                  type="button"
                  onClick={() => setDraft((p) => ({ ...p, hasLocation: !p.hasLocation }))}
                  className={clsx(
                    "h-9 w-16 rounded-full border transition",
                    draft.hasLocation ? "border-emerald-200 bg-emerald-100" : "border-slate-200 bg-white"
                  )}
                  aria-pressed={draft.hasLocation}
                >
                  <span
                    className={clsx(
                      "block h-7 w-7 translate-x-1 rounded-full bg-white shadow transition",
                      draft.hasLocation ? "translate-x-8" : "translate-x-1"
                    )}
                  />
                </button>
              </div>

              {/* Date ranges */}
              <RangeRow
                label="Aktiv bo‘lgan vaqti"
                type="date"
                from={draft.activeFrom}
                to={draft.activeTo}
                onFrom={(v) => setDraft((p) => ({ ...p, activeFrom: v }))}
                onTo={(v) => setDraft((p) => ({ ...p, activeTo: v }))}
              />
              <RangeRow
                label="Yaratilgan"
                type="date"
                from={draft.createdFrom}
                to={draft.createdTo}
                onFrom={(v) => setDraft((p) => ({ ...p, createdFrom: v }))}
                onTo={(v) => setDraft((p) => ({ ...p, createdTo: v }))}
              />
              <RangeRow
                label="Yangilangan"
                type="date"
                from={draft.updatedFrom}
                to={draft.updatedTo}
                onFrom={(v) => setDraft((p) => ({ ...p, updatedFrom: v }))}
                onTo={(v) => setDraft((p) => ({ ...p, updatedTo: v }))}
              />

              {/* Number ranges */}
              <RangeRow
                label="Latitude oralig‘i"
                type="number"
                from={draft.latMin}
                to={draft.latMax}
                onFrom={(v) => setDraft((p) => ({ ...p, latMin: v }))}
                onTo={(v) => setDraft((p) => ({ ...p, latMax: v }))}
                fromLabel="Min"
                toLabel="Max"
                placeholderFrom="41.30"
                placeholderTo="41.40"
              />
              <RangeRow
                label="Longitude oralig‘i"
                type="number"
                from={draft.lngMin}
                to={draft.lngMax}
                onFrom={(v) => setDraft((p) => ({ ...p, lngMin: v }))}
                onTo={(v) => setDraft((p) => ({ ...p, lngMax: v }))}
                fromLabel="Min"
                toLabel="Max"
                placeholderFrom="69.20"
                placeholderTo="69.35"
              />
            </div>

            {/* Hint */}
            <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
              Tip: Global qidiruv (yuqoridagi) hamma maydonlar ichidan izlaydi. Pastdagi maydonlar esa aniq filtrlash
              uchun.
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col gap-2 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <button
              type="button"
              onClick={reset}
              className={clsx(
                "rounded-2xl border px-4 py-2 text-sm font-semibold",
                hasAny ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50" : "border-slate-100 bg-slate-50 text-slate-400"
              )}
              disabled={!hasAny}
            >
              Tozalash
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={apply}
                className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Qo‘llash
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
