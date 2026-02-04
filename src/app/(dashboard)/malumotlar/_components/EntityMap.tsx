import React from "react";
import dynamic from "next/dynamic";

export type TrackPoint = { lat: number; lng: number; at: string };

type Props = {
  lat: number;
  lng: number;
  track?: TrackPoint[];
  title?: string;
};

const EntityMapClient = dynamic(() => import("./EntityMapClient"), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-900">Xarita</div>
          <div className="text-xs text-slate-500">Yuklanmoqda...</div>
        </div>
      </div>
      <div className="h-[380px] w-full rounded-2xl border border-slate-200 bg-slate-50" />
    </div>
  ),
});

export default function EntityMap(props: Props) {
  return <EntityMapClient {...props} />;
}
