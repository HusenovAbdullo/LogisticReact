"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

// Lightweight Leaflet + Leaflet.draw loader via CDN (no npm deps required)
// Produces/consumes GeoJSON Feature (Polygon/MultiPolygon)

type GeoJSONFeature = {
  type: "Feature";
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: any;
  };
  properties?: Record<string, any> & {
    style?: {
      stroke?: string;
      fill?: string;
      weight?: number;
      opacity?: number;
      fillOpacity?: number;
    };
  };
};

type Props = {
  // child polygons to show as overlays (label can be provided via feature.properties._label)
  overlays?: GeoJSONFeature[];
  label?: string;
  // Optional label for the main polygon (shown as a permanent tooltip)
  mainLabel?: string;
  value: GeoJSONFeature | null | undefined;
  onChange?: (next: GeoJSONFeature | null) => void;
  readOnly?: boolean;
  height?: number;
  // default center when no geometry exists
  defaultCenter?: [number, number];
  defaultZoom?: number;
};

const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const DRAW_JS = "https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.js";
const DRAW_CSS = "https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.css";

function ensureCss(href: string) {
  if (typeof document === "undefined") return;
  const id = `css:${href}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

function ensureStyle(id: string, cssText: string) {
  if (typeof document === "undefined") return;
  const styleId = `style:${id}`;
  if (document.getElementById(styleId)) return;
  const st = document.createElement("style");
  st.id = styleId;
  st.textContent = cssText;
  document.head.appendChild(st);
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === "undefined") return resolve();
    const id = `js:${src}`;
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing) {
      if ((existing as any).__loaded) return resolve();
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)));
      return;
    }
    const s = document.createElement("script");
    s.id = id;
    s.src = src;
    s.async = true;
    s.onload = () => {
      (s as any).__loaded = true;
      resolve();
    };
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(s);
  });
}

export default function TerritoryPicker({
  overlays,
  label = "Territoriya (xaritada belgilang)",
  mainLabel,
  value,
  onChange,
  readOnly = false,
  height = 420,
  defaultCenter = [41.3111, 69.2797], // Tashkent
  defaultZoom = 7,
}: Props) {
  const mapRef = useRef<any>(null);
  const fgRef = useRef<any>(null);
  const overlayRef = useRef<any>(null);
  const updateRef = useRef<null | (() => void)>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Style controls (saved into feature.properties.style)
  const [stroke, setStroke] = useState<string>("#111827");
  const [fill, setFill] = useState<string>("#60a5fa");
  const [weight, setWeight] = useState<number>(2);
  const [opacity, setOpacity] = useState<number>(1);
  const [fillOpacity, setFillOpacity] = useState<number>(0.25);

  const normalized = useMemo(() => {
    if (!value) return null;
    // Accept FeatureCollection (just in case)
    if ((value as any).type === "FeatureCollection") {
      const f = (value as any).features?.[0];
      return f ?? null;
    }
    return value;
  }, [value]);


  // Sync style state from incoming value
  useEffect(() => {
    const s = (normalized as any)?.properties?.style;
    if (s) {
      if (typeof s.stroke === "string") setStroke(s.stroke);
      if (typeof s.fill === "string") setFill(s.fill);
      if (typeof s.weight === "number") setWeight(s.weight);
      if (typeof s.opacity === "number") setOpacity(s.opacity);
      if (typeof s.fillOpacity === "number") setFillOpacity(s.fillOpacity);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalized]);


  useEffect(() => {
    let cancelled = false;
    async function boot() {
      try {
        ensureCss(LEAFLET_CSS);
        ensureCss(DRAW_CSS);
        ensureStyle(
          "hudud-label",
          `
          .leaflet-tooltip.hudud-label{
            background: rgba(255,255,255,0.85);
            border: 1px solid rgba(15,23,42,0.15);
            box-shadow: 0 6px 18px rgba(15,23,42,0.10);
            border-radius: 9999px;
            padding: 4px 10px;
            color: #0f172a;
            font-weight: 600;
            font-size: 12px;
          }
          .leaflet-tooltip.hudud-label:before{ display:none; }
          `
        );
        await loadScript(LEAFLET_JS);
        await loadScript(DRAW_JS);
        if (cancelled) return;
        setReady(true);
      } catch (e: any) {
        setErr(e?.message ?? "Map loader error");
      }
    }
    boot();
    return () => {
      cancelled = true;
    };
  }, []);

  // init map once
  useEffect(() => {
    if (!ready) return;
    if (!containerRef.current) return;
    if (mapRef.current) return;

    const L = (window as any).L;
    if (!L) {
      setErr("Leaflet not available");
      return;
    }

    // Fix default icon paths for CDN usage (Leaflet expects images)
    try {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
    } catch {}

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView(defaultCenter, defaultZoom);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const fg = new L.FeatureGroup();
    fg.addTo(map);

    fgRef.current = fg;
    mapRef.current = map;

    const update = () => {
      if (!onChange) return;
      const gj = fg.toGeoJSON();
      const first = (gj as any).features?.[0] ?? null;
      if (!first) return onChange(null);
      // Only keep polygon-like geometries
      const gtype = first?.geometry?.type;
      if (gtype !== "Polygon" && gtype !== "MultiPolygon") return onChange(null);
      first.properties = {
        ...(first.properties ?? {}),
        style: { stroke, fill, weight, opacity, fillOpacity },
      };
      onChange(first);
    }
    updateRef.current = update;
;

    if (!readOnly) {
      const drawControl = new L.Control.Draw({
        position: "topleft",
        draw: {
          polygon: {
            allowIntersection: false,
            showArea: true,
          },
          polyline: false,
          rectangle: false,
          circle: false,
          marker: false,
          circlemarker: false,
        },
        edit: {
          featureGroup: fg,
          edit: true,
          remove: true,
        },
      });
      map.addControl(drawControl);

      map.on(L.Draw.Event.CREATED, (e: any) => {
        // Keep only one territory at a time
        fg.clearLayers();
        // Apply current style
        try {
          e.layer?.setStyle?.({ color: stroke, fillColor: fill, weight, opacity, fillOpacity });
        } catch {}
        fg.addLayer(e.layer);
        update();
      });
      map.on(L.Draw.Event.EDITED, () => {
        try {
          fg.eachLayer((l: any) => l?.setStyle?.({ color: stroke, fillColor: fill, weight, opacity, fillOpacity }));
        } catch {}
        update();
      });
      map.on(L.Draw.Event.DELETED, () => update());
    }

    return () => {
      try {
        map.off();
        map.remove();
      } catch {}
      mapRef.current = null;
      fgRef.current = null;
      overlayRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  useEffect(() => {
    if (readOnly) return;
    const fg = fgRef.current;
    if (!fg) return;
    try {
      fg.eachLayer((l: any) => l?.setStyle?.({ color: stroke, fillColor: fill, weight, opacity, fillOpacity }));
    } catch {}
    // keep persisted value in sync
    updateRef.current?.();
  }, [stroke, fill, weight, opacity, fillOpacity]);

  // sync geometry -> map
  useEffect(() => {
    const map = mapRef.current;
    const fg = fgRef.current;
    const overlay = overlayRef.current;
    if (!map || !fg || !overlay) return;

    const L = (window as any).L;
    if (!L) return;

    // Main territory
    fg.clearLayers();
    if (normalized) {
      const layer = L.geoJSON(normalized, {
        style: (f: any) => {
          const s = f?.properties?.style ?? {};
          return {
            color: s.stroke ?? stroke,
            fillColor: s.fill ?? fill,
            weight: s.weight ?? weight,
            opacity: s.opacity ?? opacity,
            fillOpacity: s.fillOpacity ?? fillOpacity,
          };
        },
      });
      layer.eachLayer((l: any) => fg.addLayer(l));

      // label for main polygon (optional)
      if (mainLabel) {
        try {
          let bound = false;
          layer.eachLayer((l: any) => {
            if (bound) return;
            if (typeof l?.bindTooltip === "function") {
              l.bindTooltip(String(mainLabel), {
                permanent: true,
                direction: "center",
                className: "hudud-label",
              });
              bound = true;
            }
          });
        } catch {}
      }
    }

    // Overlays (children)
    overlay.clearLayers();
    (overlays ?? []).forEach((f) => {
      const overlayLabel = (f as any)?.properties?._label;
      const layer = L.geoJSON(f, {
        style: (ff: any) => {
          const s = ff?.properties?.style ?? {};
          return {
            color: s.stroke ?? "#6b7280",
            fillColor: s.fill ?? "#a3a3a3",
            weight: s.weight ?? 2,
            opacity: s.opacity ?? 0.9,
            fillOpacity: s.fillOpacity ?? 0.15,
            dashArray: "4 4",
          };
        },
      });
      layer.eachLayer((l: any) => {
        overlay.addLayer(l);
        // permanent label in the center of polygon
        if (overlayLabel && typeof l?.bindTooltip === "function") {
          try {
            l.bindTooltip(String(overlayLabel), {
              permanent: true,
              direction: "center",
              className: "hudud-label",
              opacity: 0.95,
            });
          } catch {}
        }
      });
    });

    // Fit bounds
    try {
      const b1 = fg.getBounds();
      const b2 = overlay.getBounds();
      const bounds = b1?.isValid?.() ? b1 : null;
      const bounds2 = b2?.isValid?.() ? b2 : null;
      const finalBounds = bounds && bounds2 ? bounds.extend(bounds2) : bounds || bounds2;
      if (finalBounds?.isValid?.()) map.fitBounds(finalBounds.pad(0.15));
    } catch {}
  }, [ready, normalized, overlays, stroke, fill, weight, opacity, fillOpacity, mainLabel]);

  if (err) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Xarita yuklanmadi: {err}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-medium text-slate-900">{label}</div>
        {!readOnly ? (
          <div className="text-xs text-slate-500">
            Polygon chizing → edit qiling → delete qilsangiz territory o‘chadi
          </div>
        ) : null}
      </div>

      <div
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
        style={{ height }}
      >
        
    {!readOnly ? (
      <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <label className="flex flex-col gap-1 text-xs text-slate-600">
          Stroke
          <input type="color" value={stroke} onChange={(e) => setStroke(e.target.value)} className="h-9 w-full rounded-md border border-slate-200 bg-white p-1" />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-600">
          Fill
          <input type="color" value={fill} onChange={(e) => setFill(e.target.value)} className="h-9 w-full rounded-md border border-slate-200 bg-white p-1" />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-600">
          Weight
          <input type="number" min={1} max={10} value={weight} onChange={(e) => setWeight(Number(e.target.value || 2))} className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm" />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-600">
          Opacity
          <input type="number" min={0} max={1} step={0.05} value={opacity} onChange={(e) => setOpacity(Number(e.target.value || 1))} className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm" />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-600">
          Fill opacity
          <input type="number" min={0} max={1} step={0.05} value={fillOpacity} onChange={(e) => setFillOpacity(Number(e.target.value || 0.25))} className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm" />
        </label>
      </div>
    ) : null}
<div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      </div>

      {!readOnly ? (
        <div className="text-xs text-slate-500">
          Eslatma: hozircha 1 ta territoriya saqlanadi. Yangi chizsangiz eski polygon avtomatik o‘chadi.
        </div>
      ) : null}
    </div>
  );
}
