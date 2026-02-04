"use client";

import React, { useMemo } from "react";

export type Field<T> = {
  key: keyof T;
  label: string;
  placeholder?: string;
  help?: string;
  type?:
    | "text"
    | "email"
    | "tel"
    | "number"
    | "datetime-local"
    | "textarea"
    | "select"
    | "image";
  options?: { value: string; label: string }[];
  multiple?: boolean; // for select
  required?: boolean;
  hide?: boolean;
  colSpan?: 1 | 2;
};

function asArray(v: any): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x));
  if (v == null || v === "") return [];
  return [String(v)];
}

function uniq(arr: string[]) {
  return Array.from(new Set(arr.filter(Boolean)));
}

function toDatetimeLocalValue(v: any): string {
  const s = String(v ?? "").trim();
  if (!s) return "";
  // already in local form (2026-01-10T15:30)
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  const pad = (n: number) => String(n).padStart(2, "0");
  // convert to local datetime-local format
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function MultiSelect({
  value,
  options,
  placeholder,
  onChange,
}: {
  value: any;
  options: { value: string; label: string }[];
  placeholder?: string;
  onChange: (next: string[]) => void;
}) {
  const selected = asArray(value);

  return (
    <div className="space-y-2">
      <select
        value=""
        onChange={(e) => {
          const v = String(e.currentTarget.value || "");
          if (!v) return;
          onChange(uniq([...selected, v]));
        }}
        className="min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
      >
        <option value="">{placeholder ?? "Tanlang"}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {selected.length ? (
        <div className="flex flex-wrap gap-1">
          {selected.map((x) => (
            <button
              type="button"
              key={x}
              onClick={() => onChange(selected.filter((s) => s !== x))}
              className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
              title="Olib tashlash"
            >
              <span>{x}</span>
              <span className="text-slate-500">✕</span>
            </button>
          ))}
        </div>
      ) : null}

      {/* comma-separated preview (talab qilingan UX) */}
      <div className="text-xs text-slate-500">{selected.length ? selected.join(", ") : ""}</div>
    </div>
  );
}

export default function FormBuilder<T extends Record<string, any>>({
  value,
  onChange,
  fields,
}: {
  value: T;
  onChange: (next: T) => void;
  fields: Field<T>[];
}) {
  const shown = useMemo(() => fields.filter((f) => !f.hide), [fields]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {shown.map((f) => {
        const key = String(f.key);
        const v = value[f.key] ?? "";
        const span = f.colSpan === 2 ? "sm:col-span-2" : "";

        return (
          <label key={key} className={`flex flex-col gap-1 ${span}`}>
            <span className="text-sm font-medium text-slate-700">
              {f.label}
              {f.required ? <span className="text-rose-600"> *</span> : null}
            </span>

            {f.help ? <span className="text-xs text-slate-500">{f.help}</span> : null}

            {f.type === "select" ? (
              <>
                {f.multiple ? (
                  <>
                    <MultiSelect
                      value={v}
                      options={f.options ?? []}
                      placeholder={f.placeholder}
                      onChange={(selected) => onChange({ ...value, [f.key]: selected } as T)}
                    />
                  </>
                ) : (
                  <select
                    value={String(v)}
                    onChange={(e) => onChange({ ...value, [f.key]: e.target.value } as T)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  >
                    {(f.options ?? []).map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                )}
              </>
            ) : f.type === "textarea" ? (
              <textarea
                value={String(v)}
                onChange={(e) => onChange({ ...value, [f.key]: e.target.value } as T)}
                placeholder={f.placeholder}
                rows={4}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              />
            ) : f.type === "image" ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <div className="flex items-start gap-3">
                  <div className="h-16 w-16 overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={String(v || "https://via.placeholder.com/80")}
                      alt="preview"
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="flex-1">
                    <input
                      value={String(v)}
                      onChange={(e) => onChange({ ...value, [f.key]: e.target.value } as T)}
                      placeholder={f.placeholder ?? "https://..."}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                    />

                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.currentTarget.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => {
                            const dataUrl = String(reader.result ?? "");
                            onChange({ ...value, [f.key]: dataUrl } as T);
                          };
                          reader.readAsDataURL(file);
                        }}
                        className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
                      />
                    </div>

                    <div className="mt-1 text-xs text-slate-500">
                      URL kiriting yoki rasm yuklang (base64 sifatida saqlanadi).
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <input
                value={f.type === "datetime-local" ? toDatetimeLocalValue(v) : String(v)}
                onChange={(e) => onChange({ ...value, [f.key]: e.target.value } as T)}
                placeholder={f.placeholder}
                type={f.type ?? "text"}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              />
            )}
          </label>
        );
      })}
    </div>
  );
}
