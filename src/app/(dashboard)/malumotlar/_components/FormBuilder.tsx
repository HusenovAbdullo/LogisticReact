"use client";

import React from "react";

export type Field<T> = {
  key: keyof T;
  label: string;
  placeholder?: string;
  type?: "text" | "email" | "tel" | "select";
  options?: { value: string; label: string }[];
  required?: boolean;
  hide?: boolean;
};

export default function FormBuilder<T extends Record<string, any>>({
  value,
  onChange,
  fields,
}: {
  value: T;
  onChange: (next: T) => void;
  fields: Field<T>[];
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {fields
        .filter((f) => !f.hide)
        .map((f) => {
          const v = value[f.key] ?? "";
          return (
            <label key={String(f.key)} className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-700">
                {f.label}
                {f.required ? <span className="text-rose-600"> *</span> : null}
              </span>
              {f.type === "select" ? (
                <select
                  value={String(v)}
                  onChange={(e) => onChange({ ...value, [f.key]: e.target.value })}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                >
                  {(f.options ?? []).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={String(v)}
                  onChange={(e) => onChange({ ...value, [f.key]: e.target.value })}
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
