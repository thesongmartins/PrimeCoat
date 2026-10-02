export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export type PaymentMethod = "pay_on_delivery" | "card" | "bank_transfer";
export type PaymentStatus = "unpaid" | "paid" | "refunded";
export type EmailStatus = "pending" | "sent" | "failed";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  pay_on_delivery: "Pay on Delivery",
  card: "Card",
  bank_transfer: "Bank transfer",
};

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string | null;
  productName: string;
  productImageUrl: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  userId: string;
  orderNumber: string;
  customerName: string;
  email: string;
  phone: string;
  deliveryAddress: string;
  city: string;
  state: string;
  deliveryInstructions: string | null;
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  confirmationEmailStatus: EmailStatus;
  createdAt: string;
  items: OrderItem[];
}

/** Lightweight shape for the orders list. */
export interface OrderSummary {
  id: string;
  orderNumber: string;
  total: number;
  status: OrderStatus;
  itemCount: number;
  createdAt: string;
}
