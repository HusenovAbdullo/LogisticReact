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

export type IsoDateString = string; // "2026-01-27T10:19:35.000Z"
export type DateYMD = string; // "2026-01-27"

export type GeoPoint = { lat: number; lng: number };
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

export type EmployeeRole =
  | "Operator"
  | "Dispatcher"
  | "Nazorat"
  | "Kassir"
  | "Omborchi"
  | "Menejer"
  | "Kuryer"
  | (string & {});

export type EmployeeRef = {
  id: string;
  name: string;
  role?: EmployeeRole;
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
 * Proofs (signature + parcel photo)
 * ========================= *
 * UI (ProofCard) kutadigan fieldlar:
 * - signatureUrl
 * - parcelPhotoUrl
 * - signedAt
 * - signedByName
 *
 * Kelajakda backend EmployeeRef qaytarsa ishlatish uchun:
 * - signedBy (optional)
 */

export type ProofMedia = {
  signatureUrl?: string; // imzo rasmi (png/jpg)
  parcelPhotoUrl?: string; // posilka rasmi (png/jpg)
  signedAt?: IsoDateString;

  // ✅ UI bilan mos (ProofCard signedByName ishlatyapti)
  signedByName?: string;

  // ✅ kelajakda kerak bo‘lsa (backenddan kelishi mumkin)
  signedBy?: EmployeeRef;
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
  ts: IsoDateString;

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

export type OrderEventType = "status" | "note" | "system" | "payment";

export type OrderEvent = {
  id: string;
  ts: IsoDateString;
  type: OrderEventType;

  title: string;
  description?: string;

  status?: OrderStatus;

  by?: string;

  senderEmployee?: EmployeeRef;
  receiverEmployee?: EmployeeRef;

  meta?: Record<string, unknown>;
};

/* =========================
 * Order main
 * ========================= */

export type Order = {
  id: string;
  code: string;
  barcode: string;

  createdAt: IsoDateString;
  scheduledDate: DateYMD;
  timeFrom?: string;
  timeTo?: string;

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

  route?: OrderRoute;
  history?: OrderHistoryItem[];

  // ✅ Proofs
  pickupProof?: ProofMedia | null;
  deliveryProof?: ProofMedia | null;
};

/* =========================
 * Query / view layer types
 * ========================= */

export type OrderQuery = {
  q?: string;
  statuses?: OrderStatus[];
  dateFrom?: DateYMD;
  dateTo?: DateYMD;

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

export type BagStatus = "created" | "handover";

export type Bag = {
  id: string;
  bagNo: string;            // masalan: BAG-000012
  courierId: string;
  orderIds: string[];       // qop ichidagi zakazlar
  createdAt: string;
  status: BagStatus;
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
