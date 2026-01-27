import type {
  Courier,
  Money,
  Order,
  OrderEvent,
  OrderStatus,
  PaymentMethod,
  OrderHistoryItem,
  OrderRoute,
  Party,
  EmployeeRef,
} from "../model/types";
import { uid } from "../lib/format";

/* =========================
 * Utils
 * ========================= */
function rnd(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function phone() {
  const n = () => Math.floor(rnd(0, 10));
  return `+998 9${Math.floor(rnd(0, 10))} ${n()}${n()}${n()} ${n()}${n()} ${n()}${n()}`;
}

function makeMoney(base: number, currency: Money["currency"]): Money {
  return { amount: Math.round(base), currency };
}

/* =========================
 * Static data
 * ========================= */
const CITIES = [
  { city: "Toshkent", country: "O'zbekiston", lat: 41.2995, lng: 69.2401 },
  { city: "Samarqand", country: "O'zbekiston", lat: 39.6542, lng: 66.9597 },
  { city: "Istanbul", country: "Turkiya", lat: 41.0082, lng: 28.9784 },
  { city: "Dubai", country: "BAA", lat: 25.2048, lng: 55.2708 },
  { city: "London", country: "Buyuk Britaniya", lat: 51.5074, lng: -0.1278 },
  { city: "New York", country: "AQSH", lat: 40.7128, lng: -74.006 },
  { city: "Berlin", country: "Germaniya", lat: 52.52, lng: 13.405 },
  { city: "Tokyo", country: "Yaponiya", lat: 35.6762, lng: 139.6503 },
  { city: "Seoul", country: "Koreya", lat: 37.5665, lng: 126.978 },
  { city: "Singapore", country: "Singapur", lat: 1.3521, lng: 103.8198 },
  { city: "Sydney", country: "Avstraliya", lat: -33.8688, lng: 151.2093 },
  { city: "Paris", country: "Fransiya", lat: 48.8566, lng: 2.3522 },
] as const;

const NAMES = [
  "Aziz",
  "Javohir",
  "Dilshod",
  "Shoxrux",
  "Madina",
  "Malika",
  "Sardor",
  "Umida",
  "Bekzod",
  "Nodira",
] as const;

const LAST = ["Aliyev", "Karimov", "Qodirov", "Ismoilov", "Tursunov", "Raximov", "Ortiqov"] as const;

const STREETS = [
  "Amir Temur",
  "Navoi",
  "Mustaqillik",
  "Chilonzor",
  "Yunusobod",
  "Mirzo Ulug'bek",
  "Buyuk Ipak Yo'li",
  "Beshyog'och",
] as const;

const STATUSES: readonly OrderStatus[] = [
  "processing",
  "assigned",
  "picked",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "postponed",
  "cancelled",
  "returned",
];

const PAY: readonly PaymentMethod[] = ["cash", "card", "transfer"];

const TAGS = [
  "Fragile",
  "Express",
  "COD",
  "International",
  "Returnable",
  "Priority",
  "Cold-chain",
  "Insurance",
] as const;

/* =========================
 * Couriers
 * ========================= */
export const COURIERS: Courier[] = [
  { id: "c1", name: "Rustam Qodirov", phone: "+998 90 111 11 11", vehicle: "car", active: true },
  { id: "c2", name: "Sardor Karimov", phone: "+998 90 222 22 22", vehicle: "van", active: true },
  { id: "c3", name: "Malika Ortiqova", phone: "+998 90 333 33 33", vehicle: "bike", active: true },
  { id: "c4", name: "Javohir Akramov", phone: "+998 90 444 44 44", vehicle: "truck", active: false },
];

/* =========================
 * Employees (mock) -> EmployeeRef
 * ========================= */
const EMPLOYEE_ROLES = ["Operator", "Dispatcher", "Nazorat", "Kassir", "Omborchi", "Menejer"] as const;

const EMPLOYEES: EmployeeRef[] = Array.from({ length: 12 }).map((_, i) => ({
  id: `e${i + 1}`,
  name: `${pick(NAMES)} ${pick(LAST)}`,
  role: pick(EMPLOYEE_ROLES),
}));

function party(): Party {
  const c = pick(CITIES);
  const lat = c.lat + rnd(-0.2, 0.2);
  const lng = c.lng + rnd(-0.2, 0.2);
  const name = `${pick(NAMES)} ${pick(LAST)}`;
  const address = `${pick(STREETS)} ko'ch., ${Math.floor(rnd(1, 120))}-uy`;

  return {
    name,
    phone: phone(),
    address,
    city: c.city,
    country: c.country,
    geo: { lat, lng },
  };
}

/* =========================
 * Route (mock)
 * ========================= */
function makeRoute(sender: Party, recipient: Party): OrderRoute {
  const dx = sender.geo.lat - recipient.geo.lat;
  const dy = sender.geo.lng - recipient.geo.lng;

  // rough distance: 1° ~ 111km
  const approxKm = Math.max(1, Math.round(Math.sqrt(dx * dx + dy * dy) * 111));
  const etaMin = Math.max(10, Math.round(approxKm * rnd(2, 5))); // 2–5 min/km

  return {
    distanceKm: approxKm,
    etaMin,
    polyline: [
      [sender.geo.lat, sender.geo.lng],
      [recipient.geo.lat, recipient.geo.lng],
    ],
  };
}

/* =========================
 * History (audit mock)
 * ========================= */
function makeHistory(createdAt: Date, status: OrderStatus, courierId: string | null): OrderHistoryItem[] {
  const items: OrderHistoryItem[] = [];

  const push = (mins: number, data: Omit<OrderHistoryItem, "id" | "ts">) => {
    items.push({
      id: uid("his"),
      ts: new Date(createdAt.getTime() + mins * 60_000).toISOString(),
      ...data,
    });
  };

  const op1 = pick(EMPLOYEES);
  push(0, { actorName: op1.name, action: "create" });

  const op2 = pick(EMPLOYEES);
  push(30, {
    actorName: op2.name,
    action: "update",
    field: "notes",
    from: null,
    to: "checked",
    note: "Ma'lumotlar tekshirildi",
  });

  if (courierId) {
    const cr = COURIERS.find((c) => c.id === courierId);
    const dp = pick(EMPLOYEES);

    push(60, {
      actorName: dp.name,
      action: "assign_courier",
      field: "courierId",
      from: null,
      to: cr ? cr.name : courierId,
      note: cr ? `Kuryer biriktirildi: ${cr.name}` : "Kuryer biriktirildi",
    });
  }

  const op3 = pick(EMPLOYEES);
  push(90, {
    actorName: op3.name,
    action: "status_change",
    field: "status",
    from: "processing",
    to: status,
    note: "Status yangilandi",
  });

  return items.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
}

/* =========================
 * Timeline events
 * ========================= */
function makeEvents(createdAt: Date, status: OrderStatus, courierId: string | null): OrderEvent[] {
  const events: OrderEvent[] = [];

  const push = (
    mins: number,
    title: string,
    type: OrderEvent["type"],
    s?: OrderStatus,
    extra?: Partial<OrderEvent>,
  ) => {
    const ts = new Date(createdAt.getTime() + mins * 60_000).toISOString();

    events.push({
      id: uid("ev"),
      ts,
      title,
      type,
      status: s,
      description: extra?.description,
      by: extra?.by,
      senderEmployee: extra?.senderEmployee,
      receiverEmployee: extra?.receiverEmployee,
    });
  };

  // created
  push(0, "Zakaz yaratildi", "system", "processing", {
    description: "Buyurtma tizimga kiritildi.",
    senderEmployee: pick(EMPLOYEES),
    receiverEmployee: pick(EMPLOYEES),
  });

  // checked
  push(30, "Ma'lumotlar tekshirildi", "system", "processing", {
    description: "Operator ma'lumotlarni tekshirdi.",
    senderEmployee: pick(EMPLOYEES),
    receiverEmployee: pick(EMPLOYEES),
  });

  // assign courier (only if order moved forward)
  if (["assigned", "picked", "in_transit", "out_for_delivery", "delivered"].includes(status)) {
    const dispatcher = pick(EMPLOYEES);
    const courier = courierId ? COURIERS.find((c) => c.id === courierId) : null;

    push(60, "Kuryer biriktirildi", "status", "assigned", {
      description: courier ? `Kuryer: ${courier.name}` : "Kuryer biriktirildi.",
      senderEmployee: dispatcher,
      receiverEmployee: courier ? { id: courier.id, name: courier.name, role: "Kuryer" } : pick(EMPLOYEES),
    });
  }

  if (["picked", "in_transit", "out_for_delivery", "delivered"].includes(status)) {
    push(120, "Posilka olindi", "status", "picked", {
      description: "Kuryer posilkani ombordan qabul qilib oldi.",
      senderEmployee: pick(EMPLOYEES),
      receiverEmployee: pick(EMPLOYEES),
    });
  }

  if (["in_transit", "out_for_delivery", "delivered"].includes(status)) {
    push(240, "Yo'lda", "status", "in_transit", {
      description: "Posilka yo'lda.",
      senderEmployee: pick(EMPLOYEES),
      receiverEmployee: pick(EMPLOYEES),
    });
  }

  if (["out_for_delivery", "delivered"].includes(status)) {
    push(360, "Yetkazishga chiqdi", "status", "out_for_delivery", {
      description: "Kuryer manzilga yo'l oldi.",
      senderEmployee: pick(EMPLOYEES),
      receiverEmployee: pick(EMPLOYEES),
    });
  }

  if (status === "delivered") {
    push(480, "Yetkazildi", "status", "delivered", {
      description: "Qabul qiluvchiga topshirildi.",
      senderEmployee: pick(EMPLOYEES),
      receiverEmployee: pick(EMPLOYEES),
    });
  }

  if (status === "cancelled") {
    push(180, "Bekor qilindi", "status", "cancelled", {
      description: "Buyurtma bekor qilindi.",
      senderEmployee: pick(EMPLOYEES),
      receiverEmployee: pick(EMPLOYEES),
    });
  }

  if (status === "returned") {
    push(500, "Qaytarildi", "status", "returned", {
      description: "Posilka qaytarildi.",
      senderEmployee: pick(EMPLOYEES),
      receiverEmployee: pick(EMPLOYEES),
    });
  }

  if (status === "postponed") {
    push(300, "Kechiktirildi", "status", "postponed", {
      description: "Yetkazish keyinga surildi.",
      senderEmployee: pick(EMPLOYEES),
      receiverEmployee: pick(EMPLOYEES),
    });
  }

  // timeline’da odatda “oxirgisi yuqorida” ko‘rsatasiz, lekin data har doim ascending bo‘lib tursin:
  return events.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
}

/* =========================
 * Misc generators
 * ========================= */
function code(i: number) {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const a = letters[Math.floor(Math.random() * letters.length)]!;
  const b = letters[Math.floor(Math.random() * letters.length)]!;
  return `${a}${b}-${String(1000 + i).slice(-3)}`;
}

function barcode() {
  return String(Math.floor(rnd(1e11, 9e11)));
}

/* =========================
 * (Optional) Proof generators
 * ========================= */
// Agar type’larda keyin qo‘shsangiz ishlatasiz (hozircha ishlatmasangiz ham bo‘ladi).
export const pickProof = (createdAt: Date) => ({
  signatureUrl: "./mock/signature.jpg",
  parcelPhotoUrl: "./parcel.jpg",
  signedAt: new Date(createdAt.getTime() + 70 * 60_000).toISOString(),
  signedByName: "Operator",
});

export const deliverProof = (createdAt: Date) => ({
  signatureUrl: "./mock/signature2.jpg",
  parcelPhotoUrl: "./mock/parcel2.jpg",
  signedAt: new Date(createdAt.getTime() + 480 * 60_000).toISOString(),
  signedByName: "Receiver",
});

/* =========================
 * Public API
 * ========================= */
export function generateOrders(count = 120): Order[] {
  const today = new Date();
  const list: Order[] = [];

  for (let i = 0; i < count; i++) {
    const createdAt = new Date(
      today.getTime() - rnd(0, 14) * 24 * 3600_000 - rnd(0, 12) * 3600_000,
    );

    const sch = new Date(today.getTime() + rnd(-2, 5) * 24 * 3600_000);
    const scheduledDate = sch.toISOString().slice(0, 10);

    const status = pick(STATUSES);
    const currency = pick(["UZS", "USD", "EUR"] as const);

    const pv = makeMoney(rnd(50_000, 12_000_000), currency);
    const fee = makeMoney(rnd(10_000, 1_200_000), currency);
    const total = makeMoney(pv.amount + fee.amount, currency);

    const sender = party();
    const recipient = party();

    const courierId = Math.random() < 0.7 ? pick(COURIERS).id : null;

    const slaRisk: Order["slaRisk"] =
      total.amount > 6_000_000 ? "high" : total.amount > 2_000_000 ? "medium" : "low";

    const tags = Array.from({ length: Math.floor(rnd(0, 4)) }, () => pick(TAGS));
    const uniqTags = Array.from(new Set(tags));

    list.push({
      id: uid("ord"),
      code: code(i),
      barcode: barcode(),
      createdAt: createdAt.toISOString(),
      scheduledDate,
      timeFrom: "09:00",
      timeTo: "18:00",
      status,
      slaRisk,
      sender,
      recipient,
      courierId,
      productValue: pv,
      deliveryFee: fee,
      total,
      paymentMethod: pick(PAY),
      weightKg: Math.round(rnd(1, 50) * 10) / 10,
      volumeM3: Math.round(rnd(0.01, 0.4) * 100) / 100,
      pieces: Math.floor(rnd(1, 8)),
      tags: uniqTags,
      notes: Math.random() < 0.2 ? "Mijoz eshik oldida qo'ng'iroq qilsin." : "",
      route: makeRoute(sender, recipient),
      history: makeHistory(createdAt, status, courierId),
      events: makeEvents(createdAt, status, courierId),
    });
  }

  return list;
}
