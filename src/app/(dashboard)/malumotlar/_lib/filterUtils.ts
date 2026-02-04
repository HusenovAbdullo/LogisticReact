export type Option = { value: string; label: string };

export function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

export function optionsFromValues(values: Array<string | undefined | null>, labelMap?: Record<string, string>): Option[] {
  const uniqVals = uniq(values.map((v) => String(v ?? "")).filter((v) => v));
  return uniqVals.map((v) => ({ value: v, label: labelMap?.[v] ?? v }));
}

export function optionsFromRows<T>(rows: T[], get: (r: T) => any, labelMap?: Record<string, string>): Option[] {
  return optionsFromValues(rows.map((r) => get(r)), labelMap);
}

export function hasAnyLocation(row: any): boolean {
  const lat = row?.lat ?? row?.latitude;
  const lng = row?.lng ?? row?.longitude;
  return Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));
}
