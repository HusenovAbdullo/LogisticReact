export function money(n: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n) + " " + currency;
  } catch {
    return `${Math.round(n)} ${currency}`;
  }
}

export function fmtDate(iso?: string) {
  if (!iso) return "—";
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split("-");
    return `${d}.${m}.${y}`;
  }
  try {
    const dt = new Date(iso);
    return dt.toLocaleString();
  } catch {
    return iso;
  }
}

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function toCsv(rows: Array<Record<string, any>>) {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]);
  const esc = (v: any) => {
    const s = v == null ? "" : String(v);
    const needs = /[",\n]/.test(s);
    const inner = s.replace(/"/g, '""');
    return needs ? `"${inner}"` : inner;
  };
  const head = cols.map(esc).join(",");
  const body = rows.map(r => cols.map(c => esc(r[c])).join(",")).join("\n");
  return head + "\n" + body;
}
