import type { CreateOrderForm } from "./schema";

export type CreateOrderActionState = {
  ok: boolean;
  id: string;
  error: string;
  fieldErrors?: Record<string, string>;
  receiptHtml?: string; // ✅ chek (print)
};

export type MockOrder = {
  id: string;
  createdAt: string;

  header: {
    code: string;
    barcode: string;
    status: CreateOrderForm["status"];
    sla: CreateOrderForm["sla"];
  };

  sender: {
    name: string;
    phone: string;
    city: string;
    address: string;
    lat?: string;
    lon?: string;
  };

  recipient: {
    name: string;
    phone: string;
    city: string;
    address: string;
    lat?: string;
    lon?: string;
  };

  shipment: {
    planDate?: string;      // ✅ optional
    planFrom: string;
    planTo: string;

    weightG: number;        // ✅ gramm
    volumeM3?: number | null;
    pieces: number;

    tags: string[];
    courierName?: string;
    courierPhone?: string;
  };

  payment: {
    payType: CreateOrderForm["payType"];
    amount?: number | null;
    currency?: string;
  };

  confirmations: {
    pickup?: { time?: string; by?: string };
    delivery?: { time?: string; by?: string };
  };
};
