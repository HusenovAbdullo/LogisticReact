import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import ReceiptClient from "./ReceiptClient";

export const dynamic = "force-dynamic";

const MOCK_COOKIE = "mock_orders_v2";

type MockOrder = {
  id: string;
  code?: string;
  barcode?: string;
  createdAt?: string;

  sender?: {
    name?: string;
    phone?: string;
    city?: string;
    address?: string;
  };

  recipient?: {
    name?: string;
    phone?: string;
    city?: string;
    address?: string;
  };

  shipment?: {
    weightG?: number; // ✅ gramm
    volumeM3?: number;
    pieces?: number;
    serviceType?: string;
    planDate?: string;
    planFrom?: string;
    planTo?: string;
    description?: string;
    tags?: string[];
  };

  payment?: {
    payType?: string;
    payCurrency?: string;
    payAmount?: number | string;
    payComment?: string;
  };
};

function readOrdersFromCookie(): MockOrder[] {
  const raw = cookies().get(MOCK_COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function ReceiptPage({ params }: { params: { id: string } }) {
  const list = readOrdersFromCookie();
  const order = list.find((x) => x?.id === params.id);

  if (!order) notFound();

  return <ReceiptClient order={order} />;
}
