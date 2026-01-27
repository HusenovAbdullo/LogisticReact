import type { OrdersRepository, CreateOrderInput, UpdateOrderInput, BulkUpdateInput } from "./repository";
import type { Courier, Order, OrderQuery, OrderSort, Paged } from "../model/types";
import { generateOrders, COURIERS } from "./mockData";
import { uid } from "../lib/format";

function includesText(o: Order, q: string) {
  const s = q.toLowerCase().trim();
  if (!s) return true;
  const hay = [
    o.code, o.barcode, o.sender.name, o.sender.phone, o.sender.address, o.sender.city,
    o.recipient.name, o.recipient.phone, o.recipient.address, o.recipient.city,
    o.status, o.paymentMethod, ...o.tags,
  ].join(" ").toLowerCase();
  return hay.includes(s);
}

function inRange(date: string, from?: string, to?: string) {
  if (!from && !to) return true;
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

function sortItems(items: Order[], sort: OrderSort) {
  const dir = sort.dir === "asc" ? 1 : -1;
  const key = sort.key;
  return [...items].sort((a, b) => {
    let av: any = null, bv: any = null;
    if (key === "total") { av = a.total.amount; bv = b.total.amount; }
    if (key === "status") { av = a.status; bv = b.status; }
    if (key === "createdAt") { av = a.createdAt; bv = b.createdAt; }
    if (key === "scheduledDate") { av = a.scheduledDate; bv = b.scheduledDate; }
    return av > bv ? 1 * dir : av < bv ? -1 * dir : 0;
  });
}

export class MockOrdersRepository implements OrdersRepository {
  private orders: Order[];

  constructor(seedCount = 140) {
    this.orders = generateOrders(seedCount);
  }

  async listCouriers(): Promise<Courier[]> {
    return COURIERS;
  }

  async getOrder(id: string): Promise<Order | null> {
    return this.orders.find(o => o.id === id) ?? null;
  }

  async listOrders(q: OrderQuery, sort: OrderSort, page: number, pageSize: number): Promise<Paged<Order>> {
    let items = this.orders;

    if (q.q) items = items.filter(o => includesText(o, q.q!));
    if (q.statuses?.length) items = items.filter(o => q.statuses!.includes(o.status));
    if (q.slaRisk?.length) items = items.filter(o => q.slaRisk!.includes(o.slaRisk));
    if (q.city) items = items.filter(o => o.sender.city === q.city || o.recipient.city === q.city);
    if (q.courierId !== undefined && q.courierId !== null && q.courierId !== "") items = items.filter(o => (o.courierId ?? null) === q.courierId);
    if (q.minTotal != null) items = items.filter(o => o.total.amount >= (q.minTotal as number));
    if (q.maxTotal != null) items = items.filter(o => o.total.amount <= (q.maxTotal as number));
    if (q.dateFrom || q.dateTo) items = items.filter(o => inRange(o.scheduledDate, q.dateFrom, q.dateTo));

    items = sortItems(items, sort);

    const total = items.length;
    const start = (page - 1) * pageSize;
    const paged = items.slice(start, start + pageSize);

    return { items: paged, page, pageSize, total };
  }

  async createOrder(input: CreateOrderInput): Promise<Order> {
    const now = new Date();
    const id = uid("ord");
    const code = input.code || `DL-${Math.floor(Math.random()*9000+1000)}`;
    const barcode = input.barcode || String(Math.floor(Math.random()*9e11+1e11));
    const base: Order = {
      ...input,
      id,
      code,
      barcode,
      createdAt: now.toISOString(),
      events: [
        { id: uid("ev"), ts: now.toISOString(), type: "system", title: "Zakaz yaratildi", status: "processing" },
      ],
    } as Order;
    this.orders.unshift(base);
    return base;
  }

  async updateOrder(input: UpdateOrderInput): Promise<Order> {
    const idx = this.orders.findIndex(o => o.id === input.id);
    if (idx < 0) throw new Error("Zakaz topilmadi");
    const current = this.orders[idx];
    const updated = { ...current, ...input } as Order;

    // status change timeline
    if (input.status && input.status !== current.status) {
      updated.events = [
        ...updated.events,
        { id: uid("ev"), ts: new Date().toISOString(), type: "status", title: "Status yangilandi", status: input.status },
      ];
    }
    this.orders[idx] = updated;
    return updated;
  }

  async bulkUpdate(input: BulkUpdateInput): Promise<{ ok: number; fail: number }> {
    let ok = 0, fail = 0;
    for (const id of input.ids) {
      const idx = this.orders.findIndex(o => o.id === id);
      if (idx < 0) { fail++; continue; }
      this.orders[idx] = { ...this.orders[idx], ...input.patch } as Order;
      ok++;
    }
    return { ok, fail };
  }
}
