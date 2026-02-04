"use client";

import React, { useMemo, useState } from "react";
import PageShell from "./PageShell";
import DataTable, { Column, type AdvancedFilterConfig } from "./DataTable";
import Modal from "./Modal";
import EntityDetails from "./EntityDetails";
import FormBuilder, { Field } from "./FormBuilder";
import { Button, IconButton } from "./Buttons";
import EntityMap, { TrackPoint } from "./EntityMap";

type Mode = "view" | "edit" | "create";

type ViewTab = "info" | "map";

function toNum(v: any): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function getLatLng(row: any): { lat?: number; lng?: number } {
  const lat = toNum(row?.lat ?? row?.latitude);
  const lng = toNum(row?.lng ?? row?.longitude);
  return { lat, lng };
}

function guessTitle(row: any): string {
  return (
    row?.fullName ??
    row?.name ??
    row?.title ??
    row?.phone ??
    "Lokatsiya"
  );
}

export default function CrudPageClient<T extends { id: string }>(
  props: {
    title: string;
    description?: string;
    rows: T[];
    columns: Column<T>[];
    searchKeys?: (keyof T)[];
    advancedFilter?: AdvancedFilterConfig<T>;
    fields: Field<T>[];
    createLabel?: string;
    hideCreate?: boolean;
    hideEditActions?: boolean;
    onCreate: (payload: T) => void;
    onUpdate: (id: string, patch: Partial<T>) => void;
    onRemove?: (id: string) => void;
    detailsMap?: (row: T) => Record<string, any>;
    tableOptions?: {
      showToolbar?: boolean;
      showSearch?: boolean;
      showClear?: boolean;
      defaultPageSize?: number;
      pageSizes?: number[];
    };
  }
) {
  const {
    title,
    description,
    rows,
    columns,
    searchKeys,
    advancedFilter,
    fields,
    createLabel = "Yangi qo‘shish",
    hideCreate = false,
    hideEditActions = false,
    onCreate,
    onUpdate,
    onRemove,
    detailsMap,
    tableOptions,
  } = props;

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("view");
  const [active, setActive] = useState<T | null>(null);
  const [draft, setDraft] = useState<any>(null);
  const [tab, setTab] = useState<ViewTab>("info");
  const [imageOpen, setImageOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>("");

  const close = () => {
    setOpen(false);
    setActive(null);
    setDraft(null);
    setImageOpen(false);
    setImageSrc("");
  };

  const openView = (row: T) => {
    setActive(row);
    setMode("view");
    setDraft(null);
    setTab("info");
    setOpen(true);
  };

  const openEdit = (row: T) => {
    setActive(row);
    setMode("edit");
    setDraft({ ...row });
    setOpen(true);
  };

  const openCreate = () => {
    if (hideCreate) return;
    setActive(null);
    setMode("create");
    const base: any = {};
    fields.forEach((f) => {
      if (f.type === "select") {
        base[f.key] = f.multiple ? [] : f.options?.[0]?.value ?? "";
      } else {
        base[f.key] = "";
      }
    });
    setDraft(base);
    setOpen(true);
  };

  const modalTitle =
    mode === "create"
      ? `${title}: ${createLabel}`
      : mode === "edit"
      ? `${title}: Tahrirlash`
      : `${title}: Ko‘rish`;

  const canDelete = Boolean(onRemove && active);

  const footer = useMemo(() => {
    if (mode === "view") {
      return (
        <>
          <Button variant="secondary" onClick={close}>
            Yopish
          </Button>
          {!hideEditActions && active ? <Button onClick={() => openEdit(active)}>Tahrirlash</Button> : null}
        </>
      );
    }

    if (mode === "edit") {
      return (
        <>
          <Button variant="secondary" onClick={close}>
            Bekor qilish
          </Button>
          {canDelete ? (
            <Button
              variant="danger"
              onClick={() => {
                if (!active) return;
                if (confirm("O‘chirasizmi?")) {
                  onRemove?.(active.id);
                  close();
                }
              }}
            >
              O‘chirish
            </Button>
          ) : null}
          <Button
            onClick={() => {
              if (!active) return;
              onUpdate(active.id, draft as Partial<T>);
              close();
            }}
          >
            Saqlash
          </Button>
        </>
      );
    }

    return (
      <>
        <Button variant="secondary" onClick={close}>
          Bekor qilish
        </Button>
        <Button
          onClick={() => {
            onCreate(draft as T);
            close();
          }}
        >
          Yaratish
        </Button>
      </>
    );
  }, [mode, active, canDelete, draft, onRemove, onUpdate]);

  const viewHasMap = useMemo(() => {
    if (!active) return false;
    const { lat, lng } = getLatLng(active as any);
    return lat != null && lng != null;
  }, [active]);

  const viewTrack = useMemo(() => {
    const raw: any = (active as any)?.trackPoints ?? (active as any)?.track ?? (active as any)?.tracks;
    if (!raw) return [] as TrackPoint[];
    if (!Array.isArray(raw)) return [] as TrackPoint[];
    return raw
      .map((x) => ({
        lat: toNum(x?.lat) ?? toNum(x?.latitude) ?? NaN,
        lng: toNum(x?.lng) ?? toNum(x?.longitude) ?? NaN,
        at: String(x?.at ?? x?.time ?? x?.createdAt ?? ""),
      }))
      .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng) && p.at);
  }, [active]);

  const viewAvatarSrc = useMemo(() => {
    if (!active) return "";
    const direct = String((active as any)?.avatarUrl ?? "").trim();
    if (direct) return direct;
    // fallback: first image field from form config
    const imageField = fields.find((f) => f.type === "image");
    if (!imageField) return "";
    const key = String(imageField.key);
    return String((active as any)?.[key] ?? "").trim();
  }, [active, fields]);

  const onImageClick = (src: string) => {
    if (!src) return;
    setImageSrc(src);
    setImageOpen(true);
  };

  return (
    <PageShell
      title={title}
      description={description}
      actions={
        hideCreate ? null : (
          <Button onClick={openCreate}>＋ {createLabel}</Button>
        )
      }
    >
      <DataTable
        rows={rows}
        columns={columns}
        searchKeys={searchKeys}
        advancedFilter={advancedFilter}
        showToolbar={tableOptions?.showToolbar}
        showSearch={tableOptions?.showSearch}
        showClear={tableOptions?.showClear}
        defaultPageSize={tableOptions?.defaultPageSize}
        pageSizes={tableOptions?.pageSizes}
        onRowClick={openView}
        rowActions={(r) => (
          <div className="flex justify-end gap-2">
            <IconButton title="Ko‘rish" onClick={() => openView(r)}>
              👁️
            </IconButton>
            {!hideEditActions ? (
              <IconButton title="Tahrirlash" onClick={() => openEdit(r)}>
                ✏️
              </IconButton>
            ) : null}
          </div>
        )}
      />

      <Modal open={open} title={modalTitle} onClose={close} footer={footer}>
        {mode === "view" && active ? (
          <div className="space-y-3">
            {viewAvatarSrc ? (
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                <button
                  type="button"
                  onClick={() => onImageClick(viewAvatarSrc)}
                  className="h-16 w-16 overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200 hover:opacity-90"
                  title="Rasmni kattalashtirish"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={viewAvatarSrc} alt="avatar" className="h-full w-full object-cover" />
                </button>

                <div className="min-w-0">
                  <div className="truncate text-base font-semibold text-slate-900">{guessTitle(active as any)}</div>
                  <div className="truncate text-sm text-slate-600">
                    {(active as any)?.email ?? (active as any)?.phone ?? ""}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setTab("info")}
                className={
                  "rounded-full px-4 py-2 text-sm font-semibold transition " +
                  (tab === "info" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200")
                }
              >
                Ma’lumotlar
              </button>

              <button
                type="button"
                disabled={!viewHasMap}
                onClick={() => setTab("map")}
                className={
                  "rounded-full px-4 py-2 text-sm font-semibold transition " +
                  (viewHasMap
                    ? tab === "map"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    : "cursor-not-allowed bg-slate-100 text-slate-400")
                }
                title={viewHasMap ? "" : "Koordinata kiritilmagan"}
              >
                Xarita
              </button>
            </div>

            {tab === "info" ? (
              <EntityDetails
                title="Ma’lumot"
                data={detailsMap ? detailsMap(active) : (active as any)}
                onImageClick={onImageClick}
              />
            ) : null}

            {tab === "map" && viewHasMap ? (
              <EntityMap
                title={guessTitle(active as any)}
                lat={getLatLng(active as any).lat!}
                lng={getLatLng(active as any).lng!}
                track={viewTrack}
              />
            ) : null}
          </div>
        ) : null}

        {mode !== "view" && draft ? <FormBuilder value={draft} onChange={setDraft} fields={fields} /> : null}
      </Modal>

      {imageOpen && imageSrc ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setImageOpen(false)} aria-hidden="true" />
          <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="text-base font-semibold text-slate-900">Rasm</div>
              <button
                onClick={() => setImageOpen(false)}
                className="rounded-xl px-3 py-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[78vh] overflow-auto p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageSrc} alt="preview" className="h-auto w-full rounded-2xl object-contain" />
            </div>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}
