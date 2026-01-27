"use client";

import React, { useMemo, useState } from "react";
import Button from "./ui/Button";
import { Card } from "./ui/Card";
import { useOrders } from "../state/OrdersProvider";

export default function Toolbar({ onOpenCreate }: { onOpenCreate: () => void }) {
  const { savedViews, applyView, deleteView, saveView } = useOrders();
  const [name, setName] = useState("");

  const hasViews = savedViews.length > 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="text-2xl font-semibold text-slate-900">Buyurtmalar</div>
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={onOpenCreate}>+ Yangi zakaz</Button>
        </div>
      </div>

      <Card className="p-3 md:p-4 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="text-sm font-semibold text-slate-800">Saqlangan ko‘rinishlar</div>
        <div className="flex-1" />
        <div className="flex items-center gap-2 flex-wrap">
          <input
            className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-slate-200"
            placeholder="Masalan: Bugungi ekspress"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button
            variant="secondary"
            onClick={() => {
              const n = name.trim();
              if (!n) return;
              saveView(n);
              setName("");
            }}
          >
            Saqlash
          </Button>
          {hasViews ? (
            <div className="flex items-center gap-2 flex-wrap">
              {savedViews.slice(0, 6).map(v => (
                <div key={v.id} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                  <button className="font-medium hover:underline" onClick={() => applyView(v.id)}>{v.name}</button>
                  <button className="text-slate-400 hover:text-rose-600" onClick={() => deleteView(v.id)}>✕</button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-500">Hali saqlangan ko‘rinish yo‘q.</div>
          )}
        </div>
      </Card>
    </div>
  );
}
