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

export type GeoPoint = { lat: number; lng: number };

export type Party = {
  name: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  geo: GeoPoint;
};

export type Courier = {
  id: string;
  name: string;
  phone: string;
  vehicle: "bike" | "car" | "van" | "truck";
  active: boolean;
};

export type OrderRoute = {
  distanceKm?: number;
  etaMin?: number;
  polyline?: [number, number][];
};

export type OrderHistoryItem = {
  id: string;
  ts: string; // ISO date
  actorName: string;
  action: "create" | "update" | "status_change" | "assign_courier" | "payment" | string;
  field?: string;
  from?: string | number | null;
  to?: string | number | null;
  note?: string | null;
};

export type OrderEvent = {
  id: string;
  ts: string; // ISO
  type: "status" | "note" | "system";
  title: string;
  description?: string;
  status?: OrderStatus;
  by?: string;
  senderEmployee?: {
    id: string;
    name: string;
    role?: string; // masalan: Operator, Dispatcher
  };

  receiverEmployee?: {
    id: string;
    name: string;
    role?: string;
  };
};

export type Money = { amount: number; currency: "UZS" | "USD" | "EUR" };

export type Order = {
  id: string;
  code: string;
  barcode: string;

  route?: OrderRoute;            // ✅ ADD
  history?: OrderHistoryItem[];  // ✅ ADD

  createdAt: string; // ISO
  scheduledDate: string; // YYYY-MM-DD
  timeFrom?: string; // HH:MM
  timeTo?: string; // HH:MM

  status: OrderStatus;
  slaRisk: "low" | "medium" | "high";

  sender: Party;
  recipient: Party;

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

export type OrderSort = {
  key: "createdAt" | "scheduledDate" | "total" | "status";
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
