"use client";

import React, { useMemo, useState } from "react";
import type { Courier, Order, OrderStatus } from "../../model/types";
import Modal from "./ui/Modal";
import Button from "./ui/Button";

type Mode = "create" | "edit";

function req(v: string) { return v.trim().length > 0; }

export default function OrderFormModal({
  open,
  mode,
  couriers,
  initial,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: Mode;
  couriers: Courier[];
  initial?: Partial<Order> | null;
  onClose: () => void;
  onSubmit: (payload: any) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const [senderName, setSenderName] = useState(initial?.sender?.name || "");
  const [senderPhone, setSenderPhone] = useState(initial?.sender?.phone || "");
  const [senderCity, setSenderCity] = useState(initial?.sender?.city || "Toshkent");
  const [senderAddress, setSenderAddress] = useState(initial?.sender?.address || "");

  const [recName, setRecName] = useState(initial?.recipient?.name || "");
  const [recPhone, setRecPhone] = useState(initial?.recipient?.phone || "");
  const [recCity, setRecCity] = useState(initial?.recipient?.city || "Toshkent");
  const [recAddress, setRecAddress] = useState(initial?.recipient?.address || "");

  const [status, setStatus] = useState<OrderStatus>((initial?.status as any) || "processing");
  const [courierId, setCourierId] = useState<string>((initial?.courierId as any) || "");
  const [scheduledDate, setScheduledDate] = useState(initial?.scheduledDate || new Date().toISOString().slice(0,10));
  const [notes, setNotes] = useState(initial?.notes || "");

  const valid = useMemo(() => {
    return req(senderName) && req(senderPhone) && req(senderAddress) && req(recName) && req(recPhone) && req(recAddress) && req(scheduledDate);
  }, [senderName, senderPhone, senderAddress, recName, recPhone, recAddress, scheduledDate]);

  const submit = async () => {
    setErr("");
    if (!valid) { setErr("Majburiy maydonlar to‘ldirilmagan."); return; }
    setBusy(true);
    try {
      await onSubmit({
        id: initial?.id,
        sender: { name: senderName, phone: senderPhone, city: senderCity, country: "O'zbekiston", address: senderAddress, geo: initial?.sender?.geo },
        recipient: { name: recName, phone: recPhone, city: recCity, country: "O'zbekiston", address: recAddress, geo: initial?.recipient?.geo },
        status,
        courierId: courierId || null,
        scheduledDate,
        notes,
      });
      onClose();
    } catch (e: any) {
      setErr(e?.message || "Saqlashda xatolik.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      title={mode === "create" ? "Yangi zakaz yaratish" : "Zakazni tahrirlash"}
      onClose={onClose}
      widthClass="max-w-4xl"
      footer={
        <div className="flex items-center gap-2 justify-end">
          <Button variant="secondary" onClick={onClose} disabled={busy}>Bekor qilish</Button>
          <Button onClick={submit} disabled={busy || !valid}>{busy ? "Saqlanmoqda..." : "Saqlash"}</Button>
        </div>
      }
    >
      {err ? <div className="mb-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 text-sm">{err}</div> : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="rounded-2xl border p-4">
          <div className="text-sm font-semibold">Yuboruvchi</div>
          <div className="mt-3 grid gap-2">
            <input className="h-11 px-3 rounded-xl border" placeholder="Ism" value={senderName} onChange={(e)=>setSenderName(e.target.value)} />
            <input className="h-11 px-3 rounded-xl border" placeholder="Telefon" value={senderPhone} onChange={(e)=>setSenderPhone(e.target.value)} />
            <input className="h-11 px-3 rounded-xl border" placeholder="Shahar" value={senderCity} onChange={(e)=>setSenderCity(e.target.value)} />
            <input className="h-11 px-3 rounded-xl border" placeholder="Manzil" value={senderAddress} onChange={(e)=>setSenderAddress(e.target.value)} />
          </div>
        </div>

        <div className="rounded-2xl border p-4">
          <div className="text-sm font-semibold">Qabul qiluvchi</div>
          <div className="mt-3 grid gap-2">
            <input className="h-11 px-3 rounded-xl border" placeholder="Ism" value={recName} onChange={(e)=>setRecName(e.target.value)} />
            <input className="h-11 px-3 rounded-xl border" placeholder="Telefon" value={recPhone} onChange={(e)=>setRecPhone(e.target.value)} />
            <input className="h-11 px-3 rounded-xl border" placeholder="Shahar" value={recCity} onChange={(e)=>setRecCity(e.target.value)} />
            <input className="h-11 px-3 rounded-xl border" placeholder="Manzil" value={recAddress} onChange={(e)=>setRecAddress(e.target.value)} />
          </div>
        </div>

        <div className="rounded-2xl border p-4">
          <div className="text-sm font-semibold">Operatsion</div>
          <div className="mt-3 grid gap-2">
            <label className="text-xs text-slate-500">Reja sanasi</label>
            <input className="h-11 px-3 rounded-xl border" type="date" value={scheduledDate} onChange={(e)=>setScheduledDate(e.target.value)} />
            <label className="text-xs text-slate-500">Status</label>
            <select className="h-11 px-3 rounded-xl border bg-white" value={status} onChange={(e)=>setStatus(e.target.value as any)}>
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
            <label className="text-xs text-slate-500">Kuryer</label>
            <select className="h-11 px-3 rounded-xl border bg-white" value={courierId} onChange={(e)=>setCourierId(e.target.value)}>
              <option value="">—</option>
              {couriers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div className="rounded-2xl border p-4">
          <div className="text-sm font-semibold">Izoh</div>
          <textarea className="mt-3 w-full min-h-[160px] px-3 py-2 rounded-xl border" placeholder="Qo‘shimcha izoh..." value={notes} onChange={(e)=>setNotes(e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}
