import type { Courier, Order, OrderQuery, OrderSort, Paged } from "../model/types";

export type CreateOrderInput = Omit<Order, "id" | "code" | "barcode" | "createdAt" | "events"> & {
  code?: string;
  barcode?: string;
};

export type UpdateOrderInput = Partial<Omit<Order, "events">> & { id: string };

export type BulkUpdateInput = {
  ids: string[];
  patch: Partial<Pick<Order, "status" | "courierId" | "notes" | "tags">>;
};

export interface OrdersRepository {
  listOrders(q: OrderQuery, sort: OrderSort, page: number, pageSize: number): Promise<Paged<Order>>;
  getOrder(id: string): Promise<Order | null>;
  listCouriers(): Promise<Courier[]>;
  createOrder(input: CreateOrderInput): Promise<Order>;
  updateOrder(input: UpdateOrderInput): Promise<Order>;
  bulkUpdate(input: BulkUpdateInput): Promise<{ ok: number; fail: number }>;
}
