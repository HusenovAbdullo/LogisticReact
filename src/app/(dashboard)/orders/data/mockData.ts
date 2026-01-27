import type { Courier, Money, Order, OrderEvent, OrderStatus, PaymentMethod } from "../model/types";
import { uid } from "../lib/format";

const CITIES = [
  { city: "Toshkent", country: "O'zbekiston", lat: 41.2995, lng: 69.2401 },
  { city: "Samarqand", country: "O'zbekiston", lat: 39.6542, lng: 66.9597 },
  { city: "Istanbul", country: "Turkiya", lat: 41.0082, lng: 28.9784 },
  { city: "Dubai", country: "BAA", lat: 25.2048, lng: 55.2708 },
  { city: "London", country: "Buyuk Britaniya", lat: 51.5074, lng: -0.1278 },
  { city: "New York", country: "AQSH", lat: 40.7128, lng: -74.0060 },
  { city: "Berlin", country: "Germaniya", lat: 52.52, lng: 13.405 },
  { city: "Tokyo", country: "Yaponiya", lat: 35.6762, lng: 139.6503 },
  { city: "Seoul", country: "Koreya", lat: 37.5665, lng: 126.9780 },
  { city: "Singapore", country: "Singapur", lat: 1.3521, lng: 103.8198 },
  { city: "Sydney", country: "Avstraliya", lat: -33.8688, lng: 151.2093 },
  { city: "Paris", country: "Fransiya", lat: 48.8566, lng: 2.3522 },
];

const NAMES = ["Aziz", "Javohir", "Dilshod", "Shoxrux", "Madina", "Malika", "Sardor", "Umida", "Bekzod", "Nodira"];
const LAST = ["Aliyev","Karimov","Qodirov","Ismoilov","Tursunov","Raximov","Ortiqov"];
const STREETS = ["Amir Temur", "Navoi", "Mustaqillik", "Chilonzor", "Yunusobod", "Mirzo Ulug'bek", "Buyuk Ipak Yo'li", "Beshyog'och"];
const STATUSES: OrderStatus[] = ["processing","assigned","picked","in_transit","out_for_delivery","delivered","postponed","cancelled","returned"];
const PAY: PaymentMethod[] = ["cash","card","transfer"];
const TAGS = ["Fragile", "Express", "COD", "International", "Returnable", "Priority", "Cold-chain", "Insurance"];

export const COURIERS: Courier[] = [
  { id: "c1", name: "Rustam Qodirov", phone: "+998 90 111 11 11", vehicle: "car", active: true },
  { id: "c2", name: "Sardor Karimov", phone: "+998 90 222 22 22", vehicle: "van", active: true },
  { id: "c3", name: "Malika Ortiqova", phone: "+998 90 333 33 33", vehicle: "bike", active: true },
  { id: "c4", name: "Javohir Akramov", phone: "+998 90 444 44 44", vehicle: "truck", active: false },
];

function rnd(min: number, max: number) { return Math.random() * (max - min) + min; }
function pick<T>(arr: T[]) { return arr[Math.floor(Math.random() * arr.length)]; }

function phone() {
  const n = () => Math.floor(rnd(0, 10));
  return `+998 9${Math.floor(rnd(0, 10))} ${n()}${n()}${n()} ${n()}${n()} ${n()}${n()}`;
}

function party() {
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

function makeMoney(base: number, currency: Money["currency"]): Money {
  return { amount: Math.round(base), currency };
}

function makeEvents(createdAt: Date, status: OrderStatus): OrderEvent[] {
  const events: OrderEvent[] = [];
  const push = (mins: number, title: string, t: OrderEvent["type"], s?: OrderStatus) => {
    const ts = new Date(createdAt.getTime() + mins * 60_000).toISOString();
    events.push({ id: uid("ev"), ts, title, type: t, status: s });
  };
  push(0, "Zakaz yaratildi", "system", "processing");
  push(30, "Ma'lumotlar tekshirildi", "system", "processing");
  if (["assigned","picked","in_transit","out_for_delivery","delivered"].includes(status)) push(60, "Kuryer biriktirildi", "status", "assigned");
  if (["picked","in_transit","out_for_delivery","delivered"].includes(status)) push(120, "Posilka olindi", "status", "picked");
  if (["in_transit","out_for_delivery","delivered"].includes(status)) push(240, "Yo'lda", "status", "in_transit");
  if (["out_for_delivery","delivered"].includes(status)) push(360, "Yetkazishga chiqdi", "status", "out_for_delivery");
  if (["delivered"].includes(status)) push(480, "Yetkazildi", "status", "delivered");
  if (status === "cancelled") push(180, "Bekor qilindi", "status", "cancelled");
  if (status === "returned") push(500, "Qaytarildi", "status", "returned");
  if (status === "postponed") push(300, "Kechiktirildi", "status", "postponed");
  return events.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
}

function code(i: number) {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const a = letters[Math.floor(Math.random() * letters.length)];
  const b = letters[Math.floor(Math.random() * letters.length)];
  return `${a}${b}-${String(1000 + i).slice(-3)}`;
}
function barcode() {
  return String(Math.floor(rnd(1e11, 9e11)));
}

export function generateOrders(count = 120): Order[] {
  const today = new Date();
  const list: Order[] = [];
  for (let i = 0; i < count; i++) {
    const createdAt = new Date(today.getTime() - rnd(0, 14) * 24 * 3600_000 - rnd(0, 12) * 3600_000);
    const sch = new Date(today.getTime() + rnd(-2, 5) * 24 * 3600_000);
    const scheduledDate = sch.toISOString().slice(0, 10);
    const status = pick(STATUSES);
    const currency = pick(["UZS","USD","EUR"] as const);
    const pv = makeMoney(rnd(50_000, 12_000_000), currency);
    const fee = makeMoney(rnd(10_000, 1_200_000), currency);
    const total = makeMoney(pv.amount + fee.amount, currency);
    const sender = party();
    const recipient = party();
    const courier = Math.random() < 0.7 ? pick(COURIERS).id : null;
    const slaRisk = total.amount > 6_000_000 ? "high" : total.amount > 2_000_000 ? "medium" : "low";

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
      courierId: courier,
      productValue: pv,
      deliveryFee: fee,
      total,
      paymentMethod: pick(PAY),
      weightKg: Math.round(rnd(1, 50) * 10) / 10,
      volumeM3: Math.round(rnd(0.01, 0.4) * 100) / 100,
      pieces: Math.floor(rnd(1, 8)),
      tags: uniqTags,
      notes: Math.random() < 0.2 ? "Mijoz eshik oldida qo'ng'iroq qilsin." : "",
      events: makeEvents(createdAt, status),
    });
  }
  return list;
}
