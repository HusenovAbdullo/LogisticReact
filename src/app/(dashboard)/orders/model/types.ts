/* =========================
 * Primitive / shared types
 * ========================= */

export type OrderStatus =
  | "processing"
  | "assigned"
  | "picked"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "postponed"
  | "cancelled"
  | "returned";

export type PaymentMethod = "cash" | "card" | "transfer";

export type Currency = "UZS" | "USD" | "EUR";

export type Money = {
  amount: number;
  currency: Currency;
};

export type GeoPoint = {
  lat: number;
  lng: number;
};

export type LatLngTuple = [number, number];

/* =========================
 * Parties / actors
 * ========================= */

export type Party = {
  name: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  geo: GeoPoint;
};

export type CourierVehicle = "bike" | "car" | "van" | "truck";

export type Courier = {
  id: string;
  name: string;
  phone: string;
  vehicle: CourierVehicle;
  active: boolean;
};

export type EmployeeRef = {
  id: string;
  name: string;
  role?: string; // masalan: Operator, Dispatcher, Kassir, Omborchi, Kuryer
};

/* =========================
 * Order route
 * ========================= */

export type OrderRoute = {
  distanceKm?: number;
  etaMin?: number;
  polyline?: LatLngTuple[];
};

/* =========================
 * Order history (audit)
 * ========================= */

export type OrderHistoryAction =
  | "create"
  | "update"
  | "status_change"
  | "assign_courier"
  | "payment"
  | (string & {});

export type OrderHistoryItem = {
  id: string;
  ts: string; // ISO date
  actorName: string;
  action: OrderHistoryAction;
  field?: string;

  from?: string | number | null;
  to?: string | number | null;
  note?: string | null;
};

/* =========================
 * Order events (timeline)
 * ========================= */

export type OrderEventType =
  | "status"
  | "note"
  | "system"
  | "payment"; // kelajakda kerak bo‘lishi mumkin

export type OrderEvent = {
  id: string;
  ts: string; // ISO
  type: OrderEventType;

  title: string;
  description?: string;

  // status eventlar uchun (timeline’da badge)
  status?: OrderStatus;

  // kim yozgani/trigger qilgani (oddiy string)
  by?: string;

  // kim yubordi / kim qabul qildi (siz so‘ragan blok)
  senderEmployee?: EmployeeRef;
  receiverEmployee?: EmployeeRef;
};

/* =========================
 * Order main
 * ========================= */

export type Order = {
  id: string;
  code: string;
  barcode: string;

  // Optional sections
  route?: OrderRoute;
  history?: OrderHistoryItem[];

  createdAt: string; // ISO
  scheduledDate: string; // YYYY-MM-DD
  timeFrom?: string; // HH:MM
  timeTo?: string; // HH:MM

  status: OrderStatus;
  slaRisk: "low" | "medium" | "high";

  sender: Party;
  recipient: Party;

  // courierId ba'zan null bo'lishi mumkin
  courierId?: string | null;

  productValue: Money;
  deliveryFee: Money;
  total: Money;
  paymentMethod: PaymentMethod;

  weightKg: number;
  volumeM3: number;
  pieces: number;

  tags: string[];
  notes?: string;

  events: OrderEvent[];
};

/* =========================
 * Query / view layer types
 * ========================= */

export type OrderQuery = {
  q?: string;
  statuses?: OrderStatus[];
  dateFrom?: string;
  dateTo?: string;
  city?: string;
  courierId?: string | null;

  minTotal?: number;
  maxTotal?: number;

  slaRisk?: Array<"low" | "medium" | "high">;
};

export type OrderSortKey = "createdAt" | "scheduledDate" | "total" | "status";

export type OrderSort = {
  key: OrderSortKey;
  dir: "asc" | "desc";
};

export type Paged<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

export type OrdersView = {
  id: string;
  name: string;
  query: OrderQuery;
  sort: OrderSort;
  columns: Record<string, boolean>;
};
