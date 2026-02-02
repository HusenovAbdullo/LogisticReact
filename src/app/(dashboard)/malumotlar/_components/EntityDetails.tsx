import React from "react";

export default function EntityDetails({
  title,
  data,
}: {
  title: string;
  data: Record<string, any>;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Object.entries(data).map(([k, v]) => (
          <div key={k} className="rounded-xl bg-slate-50 p-3">
            <dt className="text-xs uppercase tracking-wide text-slate-500">{k}</dt>
            <dd className="mt-1 text-sm font-medium text-slate-900">
              {v == null || v === "" ? "-" : String(v)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
