"use client";

import { useEffect, useMemo, useState } from "react";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

type LogItem = {
  id: string;
  ts: string;
  direction: "outgoing" | "incoming";
  method: string;
  url: string;
  status?: number;
  duration_ms?: number;
  error?: string;
};

export default function ApiConsole() {
  const [tab, setTab] = useState<"swagger" | "logs">("swagger");

  // filters
  const [q, setQ] = useState("");
  const [method, setMethod] = useState("");
  const [status, setStatus] = useState("");
  const [direction, setDirection] = useState("");
  const [page, setPage] = useState(1);

  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<LogItem[]>([]);
  const pageSize = 50;

  const query = useMemo(() => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (method) sp.set("method", method);
    if (status) sp.set("status", status);
    if (direction) sp.set("direction", direction);
    sp.set("page", String(page));
    sp.set("pageSize", String(pageSize));
    return sp.toString();
  }, [q, method, status, direction, page]);

  async function loadLogs() {
    const res = await fetch(`/api/logs?${query}`, { cache: "no-store" });
    const data = await res.json();
    if (data?.ok) {
      setTotal(data.total);
      setItems(data.items);
    }
  }

  async function exportJson() {
    const res = await fetch(`/api/logs/export?${query}`, { cache: "no-store" });
    const data = await res.json();
    if (data?.ok && data.downloadUrl) {
      window.location.href = data.downloadUrl;
    }
  }

  useEffect(() => {
    if (tab === "logs") loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, query]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex gap-2">
        <button
          className={`px-3 py-2 rounded border ${tab === "swagger" ? "bg-black text-white" : ""}`}
          onClick={() => setTab("swagger")}
        >
          Swagger
        </button>
        <button
          className={`px-3 py-2 rounded border ${tab === "logs" ? "bg-black text-white" : ""}`}
          onClick={() => setTab("logs")}
        >
          Request Logs
        </button>
      </div>

      {tab === "swagger" && (
        <div className="rounded border overflow-hidden">
          {/* openapi.json: public/openapi.json */}
          <SwaggerUI url="/openapi.json" />
        </div>
      )}

      {tab === "logs" && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
            <input className="border rounded px-3 py-2" placeholder="qidirish (url, error...)" value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} />
            <input className="border rounded px-3 py-2" placeholder="method (GET/POST)" value={method} onChange={(e) => { setPage(1); setMethod(e.target.value); }} />
            <input className="border rounded px-3 py-2" placeholder="status (200 yoki 200-299)" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} />
            <input className="border rounded px-3 py-2" placeholder="direction (incoming/outgoing)" value={direction} onChange={(e) => { setPage(1); setDirection(e.target.value); }} />
            <button className="border rounded px-3 py-2" onClick={exportJson}>
              Export JSON
            </button>
          </div>

          <div className="text-sm opacity-80">
            Total: {total} | Page: {page} / {Math.max(1, Math.ceil(total / pageSize))}
          </div>

          <div className="rounded border overflow-x-auto">
            <table className="min-w-[900px] w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Time</th>
                  <th className="text-left p-2">Dir</th>
                  <th className="text-left p-2">Method</th>
                  <th className="text-left p-2">URL</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">ms</th>
                  <th className="text-left p-2">Error</th>
                </tr>
              </thead>
              <tbody>
                {items.map((x) => (
                  <tr key={x.id} className="border-b">
                    <td className="p-2 whitespace-nowrap">{new Date(x.ts).toLocaleString()}</td>
                    <td className="p-2">{x.direction}</td>
                    <td className="p-2">{x.method}</td>
                    <td className="p-2">{x.url}</td>
                    <td className="p-2">{x.status ?? "-"}</td>
                    <td className="p-2">{x.duration_ms ?? "-"}</td>
                    <td className="p-2">{x.error ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2">
            <button className="border rounded px-3 py-2" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Prev
            </button>
            <button
              className="border rounded px-3 py-2"
              disabled={page >= Math.ceil(total / pageSize)}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
            <button className="border rounded px-3 py-2" onClick={loadLogs}>
              Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
