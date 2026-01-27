import type { OrderStatus } from "./types";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  processing: "Qayta ishlanmoqda",
  assigned: "Biriktirilgan",
  picked: "Olib ketildi",
  in_transit: "Yo‘lda",
  out_for_delivery: "Yetkazishga chiqdi",
  delivered: "Yetkazildi",
  postponed: "Kechiktirildi",
  cancelled: "Bekor qilindi",
  returned: "Qaytarildi",
};

export const STATUS_BADGE: Record<OrderStatus, string> = {
  processing: "bg-amber-500/15 text-amber-700 ring-amber-500/20",
  assigned: "bg-indigo-500/15 text-indigo-700 ring-indigo-500/20",
  picked: "bg-blue-500/15 text-blue-700 ring-blue-500/20",
  in_transit: "bg-cyan-500/15 text-cyan-700 ring-cyan-500/20",
  out_for_delivery: "bg-purple-500/15 text-purple-700 ring-purple-500/20",
  delivered: "bg-emerald-500/15 text-emerald-700 ring-emerald-500/20",
  postponed: "bg-sky-500/15 text-sky-700 ring-sky-500/20",
  cancelled: "bg-rose-500/15 text-rose-700 ring-rose-500/20",
  returned: "bg-zinc-500/15 text-zinc-700 ring-zinc-500/20",
};

export const SLA_BADGE: Record<"low" | "medium" | "high", string> = {
  low: "bg-emerald-500/15 text-emerald-700 ring-emerald-500/20",
  medium: "bg-amber-500/15 text-amber-700 ring-amber-500/20",
  high: "bg-rose-500/15 text-rose-700 ring-rose-500/20",
};

export const DEFAULT_COLUMNS: Record<string, boolean> = {
  select: true,
  code: true,
  barcode: true,
  status: true,
  sla: true,
  scheduled: true,
  sender: true,
  recipient: true,
  city: true,
  courier: true,
  total: true,
  actions: true,
};
