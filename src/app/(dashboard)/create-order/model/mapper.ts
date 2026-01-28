import type { CreateOrderForm } from "./schema";
import type { MockOrder } from "./types";

function uid() {
  // mock id
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function num(v: unknown, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

export function mapFormToMockOrder(data: CreateOrderForm): MockOrder {
  return {
    id: uid(),
    createdAt: data.createdAt,

    header: {
      code: data.code!,
      barcode: data.barcode!,
      status: data.status,
      sla: data.sla,
    },

    sender: {
      name: data.senderName,
      phone: data.senderPhone,
      city: data.senderCity,
      address: data.senderAddress,
      lat: data.senderLat || undefined,
      lon: data.senderLon || undefined,
    },

    recipient: {
      name: data.recipientName,
      phone: data.recipientPhone,
      city: data.recipientCity,
      address: data.recipientAddress,
      lat: data.recipientLat || undefined,
      lon: data.recipientLon || undefined,
    },

    shipment: {
      planDate: data.planDate || undefined, // ✅ optional
      planFrom: data.planFrom,
      planTo: data.planTo,

      weightG: num(data.weightG, 0),        // ✅ gramm
      volumeM3: data.volumeM3 ? num(data.volumeM3, 0) : null,
      pieces: num(data.pieces, 1),

      tags: Array.isArray(data.tags) ? data.tags : [],
      courierName: data.courierName || undefined,
      courierPhone: data.courierPhone || undefined,
    },

    payment: {
      payType: data.payType,
      amount: data.payAmount ? num(data.payAmount, 0) : null,
      currency: data.payCurrency || "UZS",
    },

    confirmations: {
      pickup: data.pickupTime || data.pickupBy ? { time: data.pickupTime || undefined, by: data.pickupBy || undefined } : undefined,
      delivery: data.deliveryTime || data.deliveryBy ? { time: data.deliveryTime || undefined, by: data.deliveryBy || undefined } : undefined,
    },
  };
}
