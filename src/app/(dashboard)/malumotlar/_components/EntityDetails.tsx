import React from "react";

function isProbablyImageKey(key: string) {
  const k = key.toLowerCase();
  return k.includes("rasm") || k.includes("avatar") || k.includes("image") || k.includes("foto") || k.includes("photo");
}

function isImageValue(v: string) {
  const s = v.toLowerCase();
  return (
    s.startsWith("data:image") ||
    s.startsWith("blob:") ||
    s.startsWith("https://") ||
    s.startsWith("http://") ||
    s.endsWith(".png") ||
    s.endsWith(".jpg") ||
    s.endsWith(".jpeg") ||
    s.endsWith(".webp") ||
    s.endsWith(".gif")
  );
}

function renderValue(key: string, v: any, onImageClick?: (src: string) => void) {
  if (v == null || v === "") return <span className="text-slate-400">-</span>;
  if (React.isValidElement(v)) return v;

  // image preview (URL or dataURL)
  if (typeof v === "string" && isProbablyImageKey(key) && isImageValue(v)) {
    const src = v;
    return (
      <button
        type="button"
        onClick={() => onImageClick?.(src)}
        className="flex items-center gap-3 rounded-xl bg-white/70 p-2 ring-1 ring-slate-200 hover:bg-white"
        title="Rasmni kattalashtirish"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="preview" className="h-14 w-14 rounded-2xl object-cover" />
        <span className="truncate text-xs font-semibold text-slate-600">Rasmni ko‘rish</span>
      </button>
    );
  }

  // arrays/objects -> pretty json (compact)
  if (typeof v === "object") {
    try {
      return (
        <pre className="whitespace-pre-wrap break-words rounded-xl bg-white/70 p-2 text-xs text-slate-700 ring-1 ring-slate-200">
          {JSON.stringify(v, null, 2)}
        </pre>
      );
    } catch {
      return <span className="text-slate-900">{String(v)}</span>;
    }
  }

  const s = String(v);
  // avoid rendering huge base64 strings directly
  if (s.startsWith("data:") && s.length > 200) {
    return <span className="text-slate-900">(base64)</span>;
  }

  return <span className="text-slate-900">{s}</span>;
}

export default function EntityDetails({
  title,
  data,
  onImageClick,
}: {
  title: string;
  data: Record<string, any>;
  onImageClick?: (src: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Object.entries(data).map(([k, v]) => (
          <div key={k} className="rounded-xl bg-slate-50 p-3">
            <dt className="text-xs uppercase tracking-wide text-slate-500">{k}</dt>
            <dd className="mt-1 text-sm font-medium">{renderValue(k, v, onImageClick)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
