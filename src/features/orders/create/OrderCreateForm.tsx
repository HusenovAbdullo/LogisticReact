"use client";

import { useState } from "react";

export default function OrderCreateForm() {
  const [ok, setOk] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setOk(true);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {ok && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
          Test zakaz yaratildi (mock).
        </div>
      )}

      <input className="input" placeholder="Jo'natuvchi ismi" />
      <input className="input" placeholder="Qabul qiluvchi ismi" />
      <input className="input" placeholder="Telefon" />
      <input className="input" placeholder="Vazn (kg)" />

      <button className="h-11 px-4 rounded-xl bg-blue-600 text-white">
        Zakaz yaratish
      </button>
    </form>
  );
}