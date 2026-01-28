"use server";

import { cookies } from "next/headers";
import { createOrderSchema, type CreateOrderForm } from "./model/schema";
import { mapFormToMockOrder } from "./model/mapper";
import type { CreateOrderActionState, MockOrder } from "./model/types";

const MOCK_COOKIE = "mock_orders_v2";
const MAX_ORDERS = 30;

function genCode() {
  const n = Math.floor(1 + Math.random() * 999);
  return `DX-${String(n).padStart(3, "0")}`;
}

function genBarcode() {
  const base = String(Math.floor(10 ** 11 + Math.random() * 9 * 10 ** 11));
  return base.slice(0, 12);
}

type CookieStore = Awaited<ReturnType<typeof cookies>>;

function safeJsonParseArray(raw?: string): any[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readList(cookieStore: CookieStore): MockOrder[] {
  const raw = cookieStore.get(MOCK_COOKIE)?.value;
  return safeJsonParseArray(raw) as MockOrder[];
}

function writeList(cookieStore: CookieStore, list: MockOrder[]) {
  const trimmed = list.slice(-MAX_ORDERS);
  cookieStore.set(MOCK_COOKIE, JSON.stringify(trimmed), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}

function toStr(v: unknown) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function toOptStr(v: unknown) {
  const s = toStr(v).trim();
  return s ? s : undefined;
}

function parseTagsJson(raw: unknown): string[] {
  const s = toStr(raw).trim();
  if (!s) return [];
  try {
    const arr = JSON.parse(s);
    if (!Array.isArray(arr)) return [];
    return arr
      .map((x) => toStr(x).trim())
      .filter(Boolean)
      .slice(0, 10);
  } catch {
    return [];
  }
}

function buildReceiptHtml(order: MockOrder) {
  const esc = (s: any) =>
    String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");

  return `
  <div style="font-family: ui-sans-serif,system-ui; padding:16px; max-width:520px;">
    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px;">
      <div>
        <div style="font-size:18px; font-weight:800;">NextLine • Chek</div>
        <div style="font-size:12px; color:#64748b;">Mock receipt</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:12px; color:#64748b;">Order ID</div>
        <div style="font-weight:800;">${esc(order.id)}</div>
      </div>
    </div>

    <hr style="margin:12px 0; border:none; border-top:1px solid #e2e8f0;" />

    <div style="display:flex; gap:12px; flex-wrap:wrap;">
      <div style="flex:1; min-width:220px;">
        <div style="font-size:12px; color:#64748b;">Kod</div>
        <div style="font-size:16px; font-weight:800;">${esc(order.header.code)}</div>
      </div>
      <div style="flex:1; min-width:220px;">
        <div style="font-size:12px; color:#64748b;">Barcode</div>
        <div style="font-size:16px; font-weight:800;">${esc(order.header.barcode)}</div>
      </div>
    </div>

    <div style="margin-top:12px; display:grid; grid-template-columns:1fr 1fr; gap:10px;">
      <div style="border:1px solid #e2e8f0; border-radius:12px; padding:10px;">
        <div style="font-size:11px; letter-spacing:.08em; color:#94a3b8; font-weight:800;">YUBORUVCHI</div>
        <div style="margin-top:6px; font-weight:800;">${esc(order.sender.name)}</div>
        <div style="color:#475569; font-size:12px;">${esc(order.sender.phone)}</div>
        <div style="color:#475569; font-size:12px;">${esc(order.sender.city)}</div>
        <div style="color:#475569; font-size:12px;">${esc(order.sender.address)}</div>
      </div>

      <div style="border:1px solid #e2e8f0; border-radius:12px; padding:10px;">
        <div style="font-size:11px; letter-spacing:.08em; color:#94a3b8; font-weight:800;">QABUL QILUVCHI</div>
        <div style="margin-top:6px; font-weight:800;">${esc(order.recipient.name)}</div>
        <div style="color:#475569; font-size:12px;">${esc(order.recipient.phone)}</div>
        <div style="color:#475569; font-size:12px;">${esc(order.recipient.city)}</div>
        <div style="color:#475569; font-size:12px;">${esc(order.recipient.address)}</div>
      </div>
    </div>

    <div style="margin-top:12px; border:1px solid #e2e8f0; border-radius:12px; padding:10px;">
      <div style="display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap;">
        <div>
          <div style="font-size:12px; color:#64748b;">Og'irlik</div>
          <div style="font-weight:800;">${esc(order.shipment.weightG)} g</div>
        </div>
        <div>
          <div style="font-size:12px; color:#64748b;">Dona</div>
          <div style="font-weight:800;">${esc(order.shipment.pieces)}</div>
        </div>
        <div>
          <div style="font-size:12px; color:#64748b;">Vaqt</div>
          <div style="font-weight:800;">${esc(order.shipment.planFrom)} - ${esc(order.shipment.planTo)}</div>
        </div>
        <div>
          <div style="font-size:12px; color:#64748b;">To'lov</div>
          <div style="font-weight:800;">${esc(order.payment.payType)} • ${esc(order.payment.currency || "UZS")}</div>
        </div>
      </div>
    </div>

    <div style="margin-top:12px; display:flex; justify-content:space-between;">
      <div style="color:#64748b; font-size:12px;">Yaratilgan</div>
      <div style="font-weight:800; font-size:12px;">${esc(new Date(order.createdAt).toLocaleString())}</div>
    </div>

    <div style="margin-top:14px; color:#94a3b8; font-size:11px;">
      Bu mock chek. Keyin backend ulanganda PDF/QR/barcode qo'shiladi.
    </div>
  </div>`;
}

export async function createOrderAction(
  _prev: CreateOrderActionState,
  formData: FormData,
): Promise<CreateOrderActionState> {
  try {
    const cookieStore = await cookies();

    const raw: Record<string, FormDataEntryValue> = Object.fromEntries(formData.entries());
    const tags = parseTagsJson(raw.tags_json);

    const input: CreateOrderForm = {
      code: toOptStr(raw.code),
      barcode: toOptStr(raw.barcode),
      status: (toStr(raw.status) || "picked_up") as any,
      sla: (toStr(raw.sla) || "high") as any,
      createdAt: toStr(raw.createdAt) || new Date().toISOString(),

      senderName: toStr(raw.senderName),
      senderPhone: toStr(raw.senderPhone),
      senderCity: toStr(raw.senderCity),
      senderAddress: toStr(raw.senderAddress),
      senderLat: toStr(raw.senderLat),
      senderLon: toStr(raw.senderLon),

      recipientName: toStr(raw.recipientName),
      recipientPhone: toStr(raw.recipientPhone),
      recipientCity: toStr(raw.recipientCity),
      recipientAddress: toStr(raw.recipientAddress),
      recipientLat: toStr(raw.recipientLat),
      recipientLon: toStr(raw.recipientLon),

      planDate: toOptStr(raw.planDate), // ✅ optional
      planFrom: toStr(raw.planFrom),
      planTo: toStr(raw.planTo),

      weightG: toStr(raw.weightG),      // ✅ gramm
      volumeM3: toStr(raw.volumeM3),
      pieces: toStr(raw.pieces),
      tags,

      courierName: toStr(raw.courierName),
      courierPhone: toStr(raw.courierPhone),

      payType: (toStr(raw.payType) || "cash") as any,
      payAmount: toStr(raw.payAmount),
      payCurrency: toStr(raw.payCurrency) || "UZS",

      pickupTime: toStr(raw.pickupTime),
      pickupBy: toStr(raw.pickupBy),
      deliveryTime: toStr(raw.deliveryTime),
      deliveryBy: toStr(raw.deliveryBy),
    };

    // auto generate
    if (!input.code) input.code = genCode();
    if (!input.barcode) input.barcode = genBarcode();
    if (!input.createdAt) input.createdAt = new Date().toISOString();

    const parsed = createOrderSchema.safeParse(input);

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".");
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      const msg = parsed.error.issues?.[0]?.message || "Ma’lumotlar noto‘g‘ri.";
      return { ok: false, id: "", error: msg, fieldErrors };
    }

    const order = mapFormToMockOrder(parsed.data);

    const list = readList(cookieStore);
    list.push(order);
    writeList(cookieStore, list);

    return { ok: true, id: order.id, error: "", receiptHtml: buildReceiptHtml(order) };
  } catch (e: any) {
    return { ok: false, id: "", error: e?.message || "Xatolik yuz berdi." };
  }
}
