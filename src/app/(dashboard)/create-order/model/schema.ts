import { z } from "zod";

const phoneUZ = z.string().trim().min(7, "Telefon majburiy").max(30);

const numStr = (msg: string) =>
  z
    .string()
    .trim()
    .refine((v) => v !== "" && !Number.isNaN(Number(v)), msg);

export const createOrderSchema = z.object({
  // ✅ optional (bo‘sh bo‘lsa server generatsiya qiladi)
  code: z.string().trim().optional(),
  barcode: z.string().trim().optional(),

  status: z.enum(["draft", "picked_up", "in_transit", "delivered", "cancelled"]),
  sla: z.enum(["low", "medium", "high"]),
  createdAt: z.string().trim().min(5),

  senderName: z.string().trim().min(2, "Yuboruvchi ism majburiy"),
  senderPhone: phoneUZ,
  senderCity: z.string().trim().min(2, "Shahar majburiy"),
  senderAddress: z.string().trim().min(3, "Manzil majburiy"),
  senderLat: z.string().trim().optional(),
  senderLon: z.string().trim().optional(),

  recipientName: z.string().trim().min(2, "Qabul qiluvchi ism majburiy"),
  recipientPhone: phoneUZ,
  recipientCity: z.string().trim().min(2, "Shahar majburiy"),
  recipientAddress: z.string().trim().min(3, "Manzil majburiy"),
  recipientLat: z.string().trim().optional(),
  recipientLon: z.string().trim().optional(),

  // ✅ reja sana ixtiyoriy
  planDate: z.string().trim().optional(), // YYYY-MM-DD
  planFrom: z.string().trim().min(1, "Vaqt (from) majburiy"), // HH:mm
  planTo: z.string().trim().min(1, "Vaqt (to) majburiy"), // HH:mm

  // ✅ og‘irlik grammda
  weightG: numStr("Og‘irlik raqam bo‘lsin (g)"),

  volumeM3: z.string().trim().optional(),
  pieces: numStr("Dona raqam bo‘lsin"),

  tags: z.array(z.string().trim()).max(10).optional(),

  courierName: z.string().trim().optional(),
  courierPhone: z.string().trim().optional(),

  payType: z.enum(["cash", "card", "transfer"]),
  payAmount: z.string().trim().optional(),
  payCurrency: z.string().trim().optional(),

  pickupTime: z.string().trim().optional(),
  pickupBy: z.string().trim().optional(),
  deliveryTime: z.string().trim().optional(),
  deliveryBy: z.string().trim().optional(),
});

export type CreateOrderForm = z.infer<typeof createOrderSchema>;
