import type { OrdersRepository, CreateOrderInput, UpdateOrderInput, BulkUpdateInput } from "./repository";
import type { Courier, Order, OrderQuery, OrderSort, Paged } from "../model/types";

/**
 * Keyin backend ulaganda shu repository'ni to'ldirasiz.
 * Sizning loyihangizda serverFetchInternal/serverFetch ishlatilsa — shu yerda ulash tavsiya.
 */
export class ApiOrdersRepository implements OrdersRepository {
  async listOrders(_q: OrderQuery, _sort: OrderSort, _page: number, _pageSize: number): Promise<Paged<Order>> {
    throw new Error("ApiOrdersRepository.listOrders hali ulanmagan");
  }
  async getOrder(_id: string): Promise<Order | null> {
    throw new Error("ApiOrdersRepository.getOrder hali ulanmagan");
  }
  async listCouriers(): Promise<Courier[]> {
    throw new Error("ApiOrdersRepository.listCouriers hali ulanmagan");
  }
  async createOrder(_input: CreateOrderInput): Promise<Order> {
    throw new Error("ApiOrdersRepository.createOrder hali ulanmagan");
  }
  async updateOrder(_input: UpdateOrderInput): Promise<Order> {
    throw new Error("ApiOrdersRepository.updateOrder hali ulanmagan");
  }
  async bulkUpdate(_input: BulkUpdateInput): Promise<{ ok: number; fail: number }> {
    throw new Error("ApiOrdersRepository.bulkUpdate hali ulanmagan");
  }
}
