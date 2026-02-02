"use client";

import React, { useMemo, useState } from "react";
import PageShell from "../_components/PageShell";
import DataTable from "../_components/DataTable";
import Modal from "../_components/Modal";
import FormBuilder from "../_components/FormBuilder";
import EntityDetails from "../_components/EntityDetails";
import { Button, IconButton } from "../_components/Buttons";
import { useHududStore } from "../_lib/useHudud";
import type { Country, District, Locality, Region } from "../_lib/types";

type Tab = "countries" | "regions" | "districts" | "localities";
type Mode = "view" | "edit" | "create";

export default function Page() {
  const { ready, state, api } = useHududStore();
  const [tab, setTab] = useState<Tab>("countries");

  // parent filters
  const [countryId, setCountryId] = useState<string | null>(null);
  const [regionId, setRegionId] = useState<string | null>(null);
  const [districtId, setDistrictId] = useState<string | null>(null);

  const countries = state.countries;
  const regions = state.regions.filter((r) => !countryId || r.countryId === countryId);
  const districts = state.districts.filter((d) => !regionId || d.regionId === regionId);
  const localities = state.localities.filter((l) => !districtId || l.districtId === districtId);

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("view");
  const [active, setActive] = useState<any>(null);
  const [draft, setDraft] = useState<any>(null);

  const close = () => {
    setOpen(false);
    setActive(null);
    setDraft(null);
  };

  const openView = (row: any) => {
    setActive(row);
    setMode("view");
    setDraft(null);
    setOpen(true);
  };
  const openEdit = (row: any) => {
    setActive(row);
    setMode("edit");
    setDraft({ ...row });
    setOpen(true);
  };
  const openCreate = () => {
    setActive(null);
    setMode("create");
    if (tab === "countries") setDraft({ name: "", code: "" });
    if (tab === "regions") setDraft({ countryId: countryId ?? countries[0]?.id ?? "", name: "" });
    if (tab === "districts") setDraft({ regionId: regionId ?? regions[0]?.id ?? "", name: "" });
    if (tab === "localities") setDraft({ districtId: districtId ?? districts[0]?.id ?? "", name: "", kind: "mahalla" });
    setOpen(true);
  };

  const modalTitle =
    mode === "create"
      ? "Yangi qo‘shish"
      : mode === "edit"
        ? "Tahrirlash"
        : "Ko‘rish";

  const tabs = useMemo(
    () => [
      { id: "countries" as const, label: "Davlatlar" },
      { id: "regions" as const, label: "Viloyatlar" },
      { id: "districts" as const, label: "Tumanlar" },
      { id: "localities" as const, label: "Mahalla / Qishloq / Ko‘cha" },
    ],
    []
  );

  const toolbar = (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      {tab !== "countries" ? (
        <select
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          value={countryId ?? ""}
          onChange={(e) => {
            const v = e.target.value || null;
            setCountryId(v);
            setRegionId(null);
            setDistrictId(null);
          }}
        >
          <option value="">Barcha davlatlar</option>
          {countries.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      ) : null}

      {tab === "districts" || tab === "localities" ? (
        <select
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          value={regionId ?? ""}
          onChange={(e) => {
            const v = e.target.value || null;
            setRegionId(v);
            setDistrictId(null);
          }}
        >
          <option value="">Barcha viloyatlar</option>
          {state.regions
            .filter((r) => !countryId || r.countryId === countryId)
            .map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
        </select>
      ) : null}

      {tab === "localities" ? (
        <select
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          value={districtId ?? ""}
          onChange={(e) => setDistrictId(e.target.value || null)}
        >
          <option value="">Barcha tumanlar</option>
          {state.districts
            .filter((d) => !regionId || d.regionId === regionId)
            .map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
        </select>
      ) : null}

      <Button onClick={openCreate}>＋ Yangi</Button>
    </div>
  );

  if (!ready) return <div className="p-4 text-slate-600">Yuklanmoqda...</div>;

  return (
    <PageShell
      title="Hududlar"
      description="Davlat → viloyat → tuman → mahalla/qishloq/ko‘cha boshqaruvi"
      actions={toolbar}
    >
      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-xl px-3 py-2 text-sm font-medium ${tab === t.id ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === "countries" ? (
          <DataTable<Country>
            rows={countries}
            searchKeys={["name", "code"]}
            columns={[
              { key: "name", header: "Davlat", render: (r) => <span className="font-medium text-slate-900">{r.name}</span> },
              { key: "code", header: "Kod", render: (r) => r.code ?? "-", hideOnMobile: true },
            ]}
            onRowClick={openView}
            rowActions={(r) => (
              <div className="flex justify-end gap-2">
                <IconButton title="Ko‘rish" onClick={() => openView(r)}>👁️</IconButton>
                <IconButton title="Tahrirlash" onClick={() => openEdit(r)}>✏️</IconButton>
              </div>
            )}
          />
        ) : null}

        {tab === "regions" ? (
          <DataTable<Region>
            rows={regions}
            searchKeys={["name", "countryId"]}
            columns={[
              {
                key: "name",
                header: "Viloyat",
                render: (r) => <span className="font-medium text-slate-900">{r.name}</span>,
              },
              {
                key: "countryId",
                header: "Davlat",
                render: (r) => countries.find((c) => c.id === r.countryId)?.name ?? "-",
                hideOnMobile: true,
              },
            ]}
            onRowClick={openView}
            rowActions={(r) => (
              <div className="flex justify-end gap-2">
                <IconButton title="Ko‘rish" onClick={() => openView(r)}>👁️</IconButton>
                <IconButton title="Tahrirlash" onClick={() => openEdit(r)}>✏️</IconButton>
              </div>
            )}
          />
        ) : null}

        {tab === "districts" ? (
          <DataTable<District>
            rows={districts}
            searchKeys={["name", "regionId"]}
            columns={[
              { key: "name", header: "Tuman", render: (r) => <span className="font-medium text-slate-900">{r.name}</span> },
              {
                key: "regionId",
                header: "Viloyat",
                render: (r) => state.regions.find((x) => x.id === r.regionId)?.name ?? "-",
                hideOnMobile: true,
              },
            ]}
            onRowClick={openView}
            rowActions={(r) => (
              <div className="flex justify-end gap-2">
                <IconButton title="Ko‘rish" onClick={() => openView(r)}>👁️</IconButton>
                <IconButton title="Tahrirlash" onClick={() => openEdit(r)}>✏️</IconButton>
              </div>
            )}
          />
        ) : null}

        {tab === "localities" ? (
          <DataTable<Locality>
            rows={localities}
            searchKeys={["name", "kind", "districtId"]}
            columns={[
              { key: "name", header: "Nomi", render: (r) => <span className="font-medium text-slate-900">{r.name}</span> },
              { key: "kind", header: "Turi", render: (r) => r.kind ?? "-" },
              {
                key: "districtId",
                header: "Tuman",
                render: (r) => state.districts.find((d) => d.id === r.districtId)?.name ?? "-",
                hideOnMobile: true,
              },
            ]}
            onRowClick={openView}
            rowActions={(r) => (
              <div className="flex justify-end gap-2">
                <IconButton title="Ko‘rish" onClick={() => openView(r)}>👁️</IconButton>
                <IconButton title="Tahrirlash" onClick={() => openEdit(r)}>✏️</IconButton>
              </div>
            )}
          />
        ) : null}
      </div>

      <Modal
        open={open}
        title={modalTitle}
        onClose={close}
        footer={
          mode === "view" ? (
            <>
              <Button variant="secondary" onClick={close}>Yopish</Button>
              {active ? <Button onClick={() => openEdit(active)}>Tahrirlash</Button> : null}
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={close}>Bekor qilish</Button>
              {mode === "edit" && active ? (
                <Button
                  variant="danger"
                  onClick={() => {
                    if (!confirm("O‘chirasizmi?")) return;
                    if (tab === "countries") api.removeCountry(active.id);
                    if (tab === "regions") api.removeRegion(active.id);
                    if (tab === "districts") api.removeDistrict(active.id);
                    if (tab === "localities") api.removeLocality(active.id);
                    close();
                  }}
                >
                  O‘chirish
                </Button>
              ) : null}
              <Button
                onClick={() => {
                  if (mode === "create") {
                    if (tab === "countries") api.addCountry(draft.name, draft.code);
                    if (tab === "regions") api.addRegion(draft.countryId, draft.name);
                    if (tab === "districts") api.addDistrict(draft.regionId, draft.name);
                    if (tab === "localities") api.addLocality(draft.districtId, draft.name, draft.kind);
                  } else if (mode === "edit" && active) {
                    if (tab === "countries") api.updateCountry(active.id, { name: draft.name, code: draft.code });
                    if (tab === "regions") api.updateRegion(active.id, { name: draft.name, countryId: draft.countryId });
                    if (tab === "districts") api.updateDistrict(active.id, { name: draft.name, regionId: draft.regionId });
                    if (tab === "localities") api.updateLocality(active.id, { name: draft.name, kind: draft.kind, districtId: draft.districtId });
                  }
                  close();
                }}
              >
                Saqlash
              </Button>
            </>
          )
        }
      >
        {mode === "view" && active ? (
          <EntityDetails
            title="Ma’lumot"
            data={(() => {
              if (tab === "countries") {
                const r = active as Country;
                return { Davlat: r.name, Kod: r.code, "Yaratilgan": r.createdAt, "Yangilangan": r.updatedAt, ID: r.id };
              }
              if (tab === "regions") {
                const r = active as Region;
                return {
                  Viloyat: r.name,
                  Davlat: countries.find((c) => c.id === r.countryId)?.name,
                  "Yaratilgan": r.createdAt,
                  "Yangilangan": r.updatedAt,
                  ID: r.id,
                };
              }
              if (tab === "districts") {
                const r = active as District;
                return {
                  Tuman: r.name,
                  Viloyat: state.regions.find((x) => x.id === r.regionId)?.name,
                  "Yaratilgan": r.createdAt,
                  "Yangilangan": r.updatedAt,
                  ID: r.id,
                };
              }
              const r = active as Locality;
              return {
                Nomi: r.name,
                Turi: r.kind,
                Tuman: state.districts.find((d) => d.id === r.districtId)?.name,
                "Yaratilgan": r.createdAt,
                "Yangilangan": r.updatedAt,
                ID: r.id,
              };
            })()}
          />
        ) : null}

        {mode !== "view" && draft ? (
          <FormBuilder
            value={draft}
            onChange={setDraft}
            fields={(() => {
              if (tab === "countries") {
                return [
                  { key: "name", label: "Davlat nomi", required: true },
                  { key: "code", label: "Kod (ixtiyoriy)", placeholder: "UZ" },
                ] as any;
              }
              if (tab === "regions") {
                return [
                  {
                    key: "countryId",
                    label: "Davlat",
                    type: "select",
                    options: countries.map((c) => ({ value: c.id, label: c.name })),
                  },
                  { key: "name", label: "Viloyat nomi", required: true },
                ] as any;
              }
              if (tab === "districts") {
                return [
                  {
                    key: "regionId",
                    label: "Viloyat",
                    type: "select",
                    options: state.regions
                      .filter((r) => !countryId || r.countryId === countryId)
                      .map((r) => ({ value: r.id, label: r.name })),
                  },
                  { key: "name", label: "Tuman nomi", required: true },
                ] as any;
              }
              return [
                {
                  key: "districtId",
                  label: "Tuman",
                  type: "select",
                  options: state.districts
                    .filter((d) => !regionId || d.regionId === regionId)
                    .map((d) => ({ value: d.id, label: d.name })),
                },
                { key: "name", label: "Nomi", required: true },
                {
                  key: "kind",
                  label: "Turi",
                  type: "select",
                  options: [
                    { value: "mahalla", label: "mahalla" },
                    { value: "qishloq", label: "qishloq" },
                    { value: "kocha", label: "ko‘cha" },
                  ],
                },
              ] as any;
            })()}
          />
        ) : null}
      </Modal>

      <div className="mt-4 flex items-center justify-end">
        <button
          className="text-xs text-slate-500 underline"
          onClick={() => api.reset()}
        >
          Demo ma’lumotlarni tiklash
        </button>
      </div>
    </PageShell>
  );
}
