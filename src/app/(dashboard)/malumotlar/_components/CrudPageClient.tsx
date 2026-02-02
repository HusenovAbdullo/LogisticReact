"use client";

import React, { useMemo, useState } from "react";
import PageShell from "./PageShell";
import DataTable, { Column } from "./DataTable";
import Modal from "./Modal";
import EntityDetails from "./EntityDetails";
import FormBuilder, { Field } from "./FormBuilder";
import { Button, IconButton } from "./Buttons";

type Mode = "view" | "edit" | "create";

export default function CrudPageClient<T extends { id: string }>(
  props: {
    title: string;
    description?: string;
    rows: T[];
    columns: Column<T>[];
    searchKeys?: (keyof T)[];
    fields: Field<T>[];
    createLabel?: string;
    hideCreate?: boolean;
    onCreate: (payload: T) => void;
    onUpdate: (id: string, patch: Partial<T>) => void;
    onRemove?: (id: string) => void;
    detailsMap?: (row: T) => Record<string, any>;
  }
) {
  const {
    title,
    description,
    rows,
    columns,
    searchKeys,
    fields,
    createLabel = "Yangi qo‘shish",
    hideCreate = false,
    onCreate,
    onUpdate,
    onRemove,
    detailsMap,
  } = props;

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("view");
  const [active, setActive] = useState<T | null>(null);
  const [draft, setDraft] = useState<any>(null);

  const close = () => {
    setOpen(false);
    setActive(null);
    setDraft(null);
  };

  const openView = (row: T) => {
    setActive(row);
    setMode("view");
    setDraft(null);
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
    // Make a blank draft from fields; keep select defaults first option.
    const base: any = {};
    fields.forEach((f) => {
      if (f.type === "select") base[f.key] = f.options?.[0]?.value ?? "";
      else base[f.key] = "";
    });
    setDraft(base);
    setOpen(true);
  };

  const modalTitle =
    mode === "create" ? `${title}: ${createLabel}` : mode === "edit" ? `${title}: Tahrirlash` : `${title}: Ko‘rish`;

  const canDelete = Boolean(onRemove && active);

  const footer = useMemo(() => {
    if (mode === "view") {
      return (
        <>
          <Button variant="secondary" onClick={close}>
            Yopish
          </Button>
          {active ? (
            <Button onClick={() => openEdit(active)}>Tahrirlash</Button>
          ) : null}
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

    // create
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

  return (
    <PageShell
      title={title}
      description={description}
      actions={
        hideCreate ? null : (
          <Button onClick={openCreate}>
            ＋ {createLabel}
          </Button>
        )
      }
    >
      <DataTable
        rows={rows}
        columns={columns}
        searchKeys={searchKeys}
        onRowClick={openView}
        rowActions={(r) => (
          <div className="flex justify-end gap-2">
            <IconButton title="Ko‘rish" onClick={() => openView(r)}>
              👁️
            </IconButton>
            <IconButton title="Tahrirlash" onClick={() => openEdit(r)}>
              ✏️
            </IconButton>
          </div>
        )}
      />

      <Modal open={open} title={modalTitle} onClose={close} footer={footer}>
        {mode === "view" && active ? (
          <EntityDetails
            title="Ma’lumot"
            data={detailsMap ? detailsMap(active) : (active as any)}
          />
        ) : null}

        {mode !== "view" && draft ? (
          <FormBuilder value={draft} onChange={setDraft} fields={fields} />
        ) : null}
      </Modal>
    </PageShell>
  );
}
