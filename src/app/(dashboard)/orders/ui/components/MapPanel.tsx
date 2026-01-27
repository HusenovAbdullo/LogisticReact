"use client";

import React, { useMemo, useState } from "react";
import type { Order } from "../../model/types";
import { project } from "../../lib/projection";
import { Card, CardHeader, CardContent } from "./ui/Card";

const WORLD_PATH = "M14,108L26,100L40,96L54,98L74,92L92,86L106,84L118,78L128,72L140,66L160,58L170,54L188,46L210,40L230,40L250,46L268,50L286,56L308,60L320,60L340,58L358,56L372,54L392,52L410,56L428,64L442,72L460,80L476,88L492,96L508,108L520,120L522,130L516,140L504,150L486,160L464,168L440,174L420,176L396,176L372,172L346,166L320,160L292,152L268,150L246,154L222,160L200,170L180,180L164,190L150,200L136,212L122,222L108,230L92,236L74,240L60,238L46,232L34,224L24,214L18,202L14,188L12,170L12,150L14,128Z";

export default function MapPanel({ orders, focusedId, onFocus }: { orders: Order[]; focusedId?: string | null; onFocus?: (id: string) => void }) {
  const w = 560;
  const h = 280;

  const pins = useMemo(() => {
    return orders.slice(0, 80).map(o => {
      const a = project(o.sender.geo.lat, o.sender.geo.lng, w, h);
      const b = project(o.recipient.geo.lat, o.recipient.geo.lng, w, h);
      return { id: o.id, a, b, city: o.recipient.city, code: o.code };
    });
  }, [orders]);

  const focused = pins.find(p => p.id === focusedId) || null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold">Xarita</div>
          <div className="text-xs text-slate-500">Demo: global buyurtmalar marshrutlari</div>
        </div>
        <div className="text-xs text-slate-500">{orders.length} ta zakaz</div>
      </CardHeader>
      <CardContent>
        <div className="rounded-2xl border bg-slate-50 overflow-hidden">
          <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
            <rect x="0" y="0" width={w} height={h} fill="transparent" />
            <path d={WORLD_PATH} fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="2" />
            {/* routes */}
            {pins.map(p => (
              <g key={p.id} opacity={focusedId && focusedId !== p.id ? 0.15 : 0.8}>
                <path
                  d={`M ${p.a.x} ${p.a.y} Q ${(p.a.x+p.b.x)/2} ${(p.a.y+p.b.y)/2 - 40} ${p.b.x} ${p.b.y}`}
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                />
                <circle cx={p.a.x} cy={p.a.y} r="3.5" fill="#0f172a" />
                <circle cx={p.b.x} cy={p.b.y} r="3.5" fill="#2563eb" />
                <circle
                  cx={p.b.x}
                  cy={p.b.y}
                  r="10"
                  fill="transparent"
                  onClick={() => onFocus?.(p.id)}
                  style={{ cursor: "pointer" }}
                />
              </g>
            ))}
            {focused ? (
              <g>
                <circle cx={focused.b.x} cy={focused.b.y} r="7" fill="#2563eb" opacity="0.25" />
                <circle cx={focused.b.x} cy={focused.b.y} r="4" fill="#2563eb" />
              </g>
            ) : null}
          </svg>
        </div>
        {focused ? (
          <div className="mt-3 text-sm">
            <div className="font-semibold">Fokus: {focused.code}</div>
            <div className="text-slate-500 text-xs">{focused.city}</div>
          </div>
        ) : (
          <div className="mt-3 text-xs text-slate-500">Pin ustiga bosing — zakaz fokus bo‘ladi.</div>
        )}
      </CardContent>
    </Card>
  );
}
