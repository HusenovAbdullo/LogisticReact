"use client";

import React from "react";
import { useFormStatus } from "react-dom";
import { createOrderAction } from "../server-actions";
import type { CreateOrderActionState } from "../model/types";
import Button from "./components/ui/Button";
import { Card } from "./components/ui/Card";
import Field from "./components/ui/Field";

type FormState = {
  senderName: string;
  senderPhone: string;
  senderCity: string;
  senderAddress: string;
  senderLat: string;
  senderLon: string;

  recipientName: string;
  recipientPhone: string;
  recipientCity: string;
  recipientAddress: string;
  recipientLat: string;
  recipientLon: string;

  code: string;
  barcode: string;

  weightG: string;     // ✅ gramm
  volumeM3: string;
  pieces: string;

  serviceType: string;

  planDate: string;    // ✅ optional
  planFrom: string;
  planTo: string;

  description: string;

  payType: string;
  payCurrency: string;
  payAmount: string;
  payComment: string;
};

function makeInitialForm(): FormState {
  return {
    senderName: "",
    senderPhone: "+998",
    senderCity: "",
    senderAddress: "",
    senderLat: "",
    senderLon: "",

    recipientName: "",
    recipientPhone: "+998",
    recipientCity: "",
    recipientAddress: "",
    recipientLat: "",
    recipientLon: "",

    code: "",
    barcode: "",

    weightG: "1000",
    volumeM3: "",
    pieces: "1",

    serviceType: "standard",

    planDate: "",
    planFrom: "09:00",
    planTo: "18:00",

    description: "",

    payType: "cash",
    payCurrency: "UZS",
    payAmount: "",
    payComment: "",
  };
}

export default function CreateOrderClient() {
  const [state, action] = React.useActionState<CreateOrderActionState, FormData>(
    createOrderAction,
    { ok: true, id: "", error: "", fieldErrors: {} },
  );

  const initialFormRef = React.useRef<FormState>(makeInitialForm());
  const [form, setForm] = React.useState<FormState>(initialFormRef.current);

  const [createdAt] = React.useState(() => new Date().toISOString());

  // tags
  const [tagInput, setTagInput] = React.useState("");
  const [tags, setTags] = React.useState<string[]>([]);
  const tagsJson = React.useMemo(() => JSON.stringify(tags.slice(0, 10)), [tags]);

  const lastSuccessId = React.useRef<string>("");

  // ✅ success bo‘lsa - hammasini tozalash
  React.useEffect(() => {
    if (state?.ok && state?.id && lastSuccessId.current !== state.id) {
      lastSuccessId.current = state.id;
      setForm(initialFormRef.current);
      setTags([]);
      setTagInput("");
    }
  }, [state?.ok, state?.id]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  function addTag() {
    const v = tagInput.trim();
    if (!v) return;
    setTags((prev) => {
      if (prev.some((x) => x.toLowerCase() === v.toLowerCase())) return prev;
      return [...prev, v].slice(0, 10);
    });
    setTagInput("");
  }

  function removeTag(v: string) {
    setTags((prev) => prev.filter((x) => x !== v));
  }

  // field errors
  const fe = state?.fieldErrors ?? {};
  const err = (name: string) => fe?.[name] ?? "";
  const cls = (name: string) => ["input", err(name) ? "input-error" : ""].join(" ");

  const codeLabel = form.code.trim() ? form.code.trim() : "Auto";
  const barcodeLabel = form.barcode.trim() ? form.barcode.trim() : "Auto";

  // ✅ receipt print
  function printReceipt() {
    const html = state?.receiptHtml;
    if (!html) return;

    const w = window.open("", "_blank", "width=720,height=900");
    if (!w) return;

    w.document.open();
    w.document.write(`
      <html>
        <head>
          <title>Chek</title>
          <meta charset="utf-8" />
          <style>
            @media print { .no-print { display:none !important; } }
            body { margin:0; background:#fff; }
          </style>
        </head>
        <body>
          <div class="no-print" style="padding:12px; border-bottom:1px solid #e2e8f0;">
            <button onclick="window.print()" style="padding:10px 14px;border-radius:12px;border:1px solid #e2e8f0;background:#fff;cursor:pointer;">
              Print
            </button>
            <button onclick="window.close()" style="padding:10px 14px;border-radius:12px;border:1px solid #e2e8f0;background:#fff;cursor:pointer;margin-left:8px;">
              Close
            </button>
          </div>
          ${html}
          <script>setTimeout(()=>window.print(), 200);</script>
        </body>
      </html>
    `);
    w.document.close();
  }

  return (
    <div className="mx-auto w-full max-w-[1560px] px-4 py-4 md:px-6 md:py-5">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-lg md:text-xl font-semibold text-slate-900 dark:text-slate-100">
              Zakaz yaratish
            </div>
            {/* <div className="mt-0.5 text-[13px] leading-5 text-slate-500">
              Backend ulanmagan (mock). Saqlanganda cookie’da saqlanadi.
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Pill k="Kod" v={codeLabel} muted={!form.code.trim()} />
              <Pill k="Barcode" v={barcodeLabel} muted={!form.barcode.trim()} />
            </div> */}
          </div>

          <div className="flex items-center gap-2">
            {state?.ok && state?.id && state?.receiptHtml ? (
              <Button type="button" variant="outline" onClick={printReceipt}>
                Chek (print)
              </Button>
            ) : null}
            <Button type="button" variant="outline">
              +
            </Button>
          </div>
        </div>

        <div className="mt-3 grid gap-2">
          {state?.ok && state?.id ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              ✅ Zakaz yaratildi. ID: <b>{state.id}</b>
              {state?.receiptHtml ? (
                <button
                  type="button"
                  className="ml-3 underline text-emerald-800"
                  onClick={printReceipt}
                >
                  Chekni chiqarish
                </button>
              ) : null}
            </div>
          ) : null}

          {!state?.ok && state?.error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.error}
            </div>
          ) : null}
        </div>
      </div>

      <form action={action} className="mt-3 grid gap-3">
        <input type="hidden" name="createdAt" value={createdAt} />
        <input type="hidden" name="tags_json" value={tagsJson} />
        <input type="hidden" name="status" value="picked_up" />
        <input type="hidden" name="sla" value="high" />

        <div className="grid gap-3 lg:grid-cols-2">
          {/* 1) Yuboruvchi */}
          <Card className="p-4 shadow-sm">
            <CardHeader title="Yuboruvchining ma’lumotlari" subtitle="Jo‘natmani yuborayotgan shaxs/korxona" />

            <div className="mt-3 grid gap-2.5">
              <div className="grid gap-2.5 md:grid-cols-2">
                <Field label="F.I.Sh">
                  <input
                    name="senderName"
                    className={cls("senderName")}
                    value={form.senderName}
                    onChange={(e) => setField("senderName", e.target.value)}
                  />
                  {err("senderName") ? <ErrorText>{err("senderName")}</ErrorText> : null}
                </Field>

                <Field label="Telefon">
                  <input
                    name="senderPhone"
                    className={cls("senderPhone")}
                    value={form.senderPhone}
                    onChange={(e) => setField("senderPhone", e.target.value)}
                  />
                  {err("senderPhone") ? <ErrorText>{err("senderPhone")}</ErrorText> : null}
                </Field>
              </div>

              <Field label="Shahar / mamlakat">
                <input
                  name="senderCity"
                  className={cls("senderCity")}
                  value={form.senderCity}
                  onChange={(e) => setField("senderCity", e.target.value)}
                />
                {err("senderCity") ? <ErrorText>{err("senderCity")}</ErrorText> : null}
              </Field>

              <Field label="Manzil">
                <input
                  name="senderAddress"
                  className={cls("senderAddress")}
                  value={form.senderAddress}
                  onChange={(e) => setField("senderAddress", e.target.value)}
                />
                {err("senderAddress") ? <ErrorText>{err("senderAddress")}</ErrorText> : null}
              </Field>

              <div className="grid gap-2.5 md:grid-cols-2">
                <Field label="Geo Lat (ixtiyoriy)">
                  <input
                    name="senderLat"
                    className="input"
                    value={form.senderLat}
                    onChange={(e) => setField("senderLat", e.target.value)}
                  />
                </Field>

                <Field label="Geo Lon (ixtiyoriy)">
                  <input
                    name="senderLon"
                    className="input"
                    value={form.senderLon}
                    onChange={(e) => setField("senderLon", e.target.value)}
                  />
                </Field>
              </div>
            </div>
          </Card>

          {/* 2) Qabul qiluvchi */}
          <Card className="p-4 shadow-sm">
            <CardHeader title="Qabul qiluvchining manzili" subtitle="Jo‘natma qayerga yetkaziladi" />

            <div className="mt-3 grid gap-2.5">
              <div className="grid gap-2.5 md:grid-cols-2">
                <Field label="F.I.Sh">
                  <input
                    name="recipientName"
                    className={cls("recipientName")}
                    value={form.recipientName}
                    onChange={(e) => setField("recipientName", e.target.value)}
                  />
                  {err("recipientName") ? <ErrorText>{err("recipientName")}</ErrorText> : null}
                </Field>

                <Field label="Telefon">
                  <input
                    name="recipientPhone"
                    className={cls("recipientPhone")}
                    value={form.recipientPhone}
                    onChange={(e) => setField("recipientPhone", e.target.value)}
                  />
                  {err("recipientPhone") ? <ErrorText>{err("recipientPhone")}</ErrorText> : null}
                </Field>
              </div>

              <Field label="Shahar / mamlakat">
                <input
                  name="recipientCity"
                  className={cls("recipientCity")}
                  value={form.recipientCity}
                  onChange={(e) => setField("recipientCity", e.target.value)}
                />
                {err("recipientCity") ? <ErrorText>{err("recipientCity")}</ErrorText> : null}
              </Field>

              <Field label="Manzil">
                <input
                  name="recipientAddress"
                  className={cls("recipientAddress")}
                  value={form.recipientAddress}
                  onChange={(e) => setField("recipientAddress", e.target.value)}
                />
                {err("recipientAddress") ? <ErrorText>{err("recipientAddress")}</ErrorText> : null}
              </Field>

              <div className="grid gap-2.5 md:grid-cols-2">
                <Field label="Geo Lat (ixtiyoriy)">
                  <input
                    name="recipientLat"
                    className="input"
                    value={form.recipientLat}
                    onChange={(e) => setField("recipientLat", e.target.value)}
                  />
                </Field>

                <Field label="Geo Lon (ixtiyoriy)">
                  <input
                    name="recipientLon"
                    className="input"
                    value={form.recipientLon}
                    onChange={(e) => setField("recipientLon", e.target.value)}
                  />
                </Field>
              </div>
            </div>
          </Card>

          {/* 3) Jo‘natma turi */}
          <Card className="p-4 shadow-sm">
            <CardHeader title="Jo‘natma turi" subtitle="Parametrlar va reja" />

            <div className="mt-3 grid gap-2.5">
              <div className="grid gap-2.5 md:grid-cols-2">
                <Field label="Jo‘natma kodi (ixtiyoriy)">
                  <input
                    name="code"
                    className="input"
                    value={form.code}
                    onChange={(e) => setField("code", e.target.value)}
                  />
                  <Hint>Bo‘sh qoldirsangiz auto.</Hint>
                </Field>

                <Field label="Barcode (ixtiyoriy)">
                  <input
                    name="barcode"
                    className="input"
                    value={form.barcode}
                    onChange={(e) => setField("barcode", e.target.value)}
                    inputMode="numeric"
                  />
                  <Hint>Bo‘sh qoldirsangiz auto.</Hint>
                </Field>
              </div>

              <div className="grid gap-2.5 md:grid-cols-3">
                <Field label="Og‘irlik (g)">
                  <input
                    name="weightG"
                    type="number"
                    step="1"
                    className={cls("weightG")}
                    value={form.weightG}
                    onChange={(e) => setField("weightG", e.target.value)}
                  />
                  {err("weightG") ? <ErrorText>{err("weightG")}</ErrorText> : null}
                </Field>

                <Field label="Hajm (m³) (ixtiyoriy)">
                  <input
                    name="volumeM3"
                    type="number"
                    step="0.001"
                    className="input"
                    value={form.volumeM3}
                    onChange={(e) => setField("volumeM3", e.target.value)}
                  />
                </Field>

                <Field label="Dona">
                  <input
                    name="pieces"
                    type="number"
                    className={cls("pieces")}
                    value={form.pieces}
                    onChange={(e) => setField("pieces", e.target.value)}
                  />
                  {err("pieces") ? <ErrorText>{err("pieces")}</ErrorText> : null}
                </Field>
              </div>

              <div className="grid gap-2.5 md:grid-cols-3">
                <Field label="Xizmat turi">
                  <select
                    name="serviceType"
                    className="input"
                    value={form.serviceType}
                    onChange={(e) => setField("serviceType", e.target.value)}
                  >
                    <option value="standard">Standard</option>
                    <option value="express">Express</option>
                    <option value="cold_chain">Cold-chain</option>
                  </select>
                </Field>

                <Field label="Reja sana (ixtiyoriy)">
                  <input
                    name="planDate"
                    type="date"
                    className="input"
                    value={form.planDate}
                    onChange={(e) => setField("planDate", e.target.value)}
                  />
                </Field>

                <Field label="Vaqt oralig‘i">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <input
                        name="planFrom"
                        type="time"
                        className={cls("planFrom")}
                        value={form.planFrom}
                        onChange={(e) => setField("planFrom", e.target.value)}
                      />
                      {err("planFrom") ? <ErrorText>{err("planFrom")}</ErrorText> : null}
                    </div>
                    <div>
                      <input
                        name="planTo"
                        type="time"
                        className={cls("planTo")}
                        value={form.planTo}
                        onChange={(e) => setField("planTo", e.target.value)}
                      />
                      {err("planTo") ? <ErrorText>{err("planTo")}</ErrorText> : null}
                    </div>
                  </div>
                </Field>
              </div>

              <Field label="Izoh (ixtiyoriy)">
                <textarea
                  name="description"
                  className="input"
                  rows={2}
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                />
              </Field>

              {/* tags */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-950/40">
                <div className="flex items-center justify-between">
                  <div className="text-[13px] font-medium text-slate-700 dark:text-slate-200">Taglar</div>
                  <div className="text-[11px] text-slate-500">{tags.length}/10</div>
                </div>

                {tags.length ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-2 rounded-xl bg-white px-2.5 py-1 text-[13px] text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-800"
                      >
                        {t}
                        <button type="button" onClick={() => removeTag(t)} className="text-slate-400 hover:text-slate-900">
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="mt-2 flex gap-2">
                  <input
                    className="input"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Tag (Enter)"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    Qo‘shish
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* 4) To‘lov */}
          <Card className="p-4 shadow-sm">
            <CardHeader title="To‘lov" subtitle="To‘lov turi va summa" />

            <div className="mt-3 grid gap-2.5">
              <div className="grid gap-2.5 md:grid-cols-2">
                <Field label="To‘lov turi">
                  <select
                    name="payType"
                    className={cls("payType")}
                    value={form.payType}
                    onChange={(e) => setField("payType", e.target.value)}
                  >
                    <option value="cash">Naqd</option>
                    <option value="card">Karta</option>
                    <option value="transfer">O‘tkazma</option>
                  </select>
                  {err("payType") ? <ErrorText>{err("payType")}</ErrorText> : null}
                </Field>

                <Field label="Valyuta">
                  <select
                    name="payCurrency"
                    className="input"
                    value={form.payCurrency}
                    onChange={(e) => setField("payCurrency", e.target.value)}
                  >
                    <option value="UZS">UZS</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </Field>
              </div>

              <div className="grid gap-2.5 md:grid-cols-2">
                <Field label="Summa (ixtiyoriy)">
                  <input
                    name="payAmount"
                    className="input"
                    value={form.payAmount}
                    onChange={(e) => setField("payAmount", e.target.value)}
                  />
                </Field>

                <Field label="To‘lov izohi (ixtiyoriy)">
                  <input
                    name="payComment"
                    className="input"
                    value={form.payComment}
                    onChange={(e) => setField("payComment", e.target.value)}
                  />
                </Field>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300">
                Mock rejim: billing yo‘q. Keyin backendga ulaymiz.
              </div>
            </div>
          </Card>
        </div>

        {/* Footer actions */}
        <div className="sticky bottom-3 z-10">
          <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-2 backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setForm(initialFormRef.current);
                  setTags([]);
                  setTagInput("");
                }}
              >
                Bekor qilish
              </Button>
              <Submit />
            </div>
          </div>
        </div>
      </form>

      <style jsx global>{`
        .input {
          height: 40px;
          width: 100%;
          border-radius: 14px;
          border: 1px solid rgba(226, 232, 240, 1);
          background: white;
          padding: 0 10px;
          font-size: 13px;
          color: rgb(15, 23, 42);
          outline: none;
          transition: box-shadow 160ms ease, border-color 160ms ease, background 160ms ease;
        }
        .input:focus {
          border-color: rgba(59, 130, 246, 1);
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12);
        }
        .input-error {
          border-color: rgba(239, 68, 68, 1) !important;
          box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.12) !important;
        }
        textarea.input {
          height: auto;
          padding: 8px 10px;
          line-height: 1.35;
        }
        select.input {
          padding-right: 28px;
        }
        @media (prefers-color-scheme: dark) {
          .input {
            background: rgb(15, 23, 42);
            border-color: rgba(30, 41, 59, 1);
            color: rgb(226, 232, 240);
          }
        }
      `}</style>
    </div>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saqlanmoqda..." : "Zakaz yaratish"}
    </Button>
  );
}

function CardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{title}</div>
        {subtitle ? <div className="mt-1 text-[13px] leading-5 text-slate-500">{subtitle}</div> : null}
      </div>
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <div className="mt-1 text-[11px] leading-4 text-slate-500">{children}</div>;
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return <div className="mt-1 text-[11px] leading-4 text-red-600">{children}</div>;
}

function Pill({ k, v, muted }: { k: string; v: string; muted?: boolean }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-2xl border px-2.5 py-1 text-[13px]",
        muted
          ? "border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400"
          : "border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100",
      ].join(" ")}
    >
      <span className="text-slate-400">{k}:</span>
      <b className="font-semibold">{v}</b>
    </span>
  );
}
