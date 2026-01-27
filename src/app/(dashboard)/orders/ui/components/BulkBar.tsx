"use client";

import React, { useMemo, useState } from "react";
import Button from "./ui/Button";
import { Card } from "./ui/Card";
import { useOrders } from "../state/OrdersProvider";
import type { OrderStatus } from "../../model/types";

export default function BulkBar({ couriers, onToast }: { couriers: Array<{ id: string; name: string }>; onToast: (t: any) => void }) {
  const { selectedIds, setSelectedIds, repo } = useOrders();
  const [courierId, setCourierId] = useState("");
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [busy, setBusy] = useState(false);

  if (!selectedIds.length) return null;

  const apply = async () => {
    if (!courierId && !status) {
      onToast({ type: "error", message: "Kamida bitta amal tanlang (kuryer yoki status)." });
      return;
    }
    setBusy(true);
    try {
      const patch: any = {};
      if (courierId) patch.courierId = courierId;
      if (status) patch.status = status;
      const res = await repo.bulkUpdate({ ids: selectedIds, patch });
      onToast({ type: "success", message: `Bulk yangilandi: ${res.ok} ta (xato: ${res.fail}).` });
      setSelectedIds([]);
    } catch (e: any) {
      onToast({ type: "error", message: e?.message || "Bulk amalida xatolik." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-3 md:p-4 flex items-center gap-2 flex-wrap">
      <div className="text-sm">
        Tanlandi: <b>{selectedIds.length}</b>
      </div>

      <div className="flex-1" />

      <select className="h-10 px-3 rounded-xl border border-slate-200 bg-white" value={courierId} onChange={(e) => setCourierId(e.target.value)}>
        <option value="">Kuryer tanlang</option>
        {couriers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>

      <select className="h-10 px-3 rounded-xl border border-slate-200 bg-white" value={status} onChange={(e) => setStatus(e.target.value as any)}>
        <option value="">Status tanlang</option>
        <option value="processing">Qayta ishlanmoqda</option>
        <option value="assigned">Biriktirilgan</option>
        <option value="picked">Olib ketildi</option>
        <option value="in_transit">Yo‘lda</option>
        <option value="out_for_delivery">Yetkazishga chiqdi</option>
        <option value="delivered">Yetkazildi</option>
        <option value="postponed">Kechiktirildi</option>
        <option value="cancelled">Bekor qilindi</option>
        <option value="returned">Qaytarildi</option>
      </select>

      <Button disabled={busy} onClick={apply}>{busy ? "Yuborilmoqda..." : "Qo‘llash"}</Button>
      <Button variant="secondary" disabled={busy} onClick={() => setSelectedIds([])}>Bekor qilish</Button>
    </Card>
  );
}
