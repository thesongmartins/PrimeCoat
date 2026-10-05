import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/types/order";

const TONES: Record<OrderStatus, "neutral" | "success" | "warning" | "danger" | "accent" | "info"> = {
  pending: "warning",
  confirmed: "info",
  processing: "info",
  out_for_delivery: "accent",
  delivered: "success",
  cancelled: "danger",
};

export function OrderStatusBadge({ status, awaitingPayment = false }: { status: OrderStatus; awaitingPayment?: boolean }) {
  if (awaitingPayment && status !== "cancelled") return <Badge tone="warning">Awaiting payment</Badge>;
  return <Badge tone={TONES[status]}>{ORDER_STATUS_LABELS[status]}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: "unpaid" | "paid" | "refunded" }) {
  const tone = status === "paid" ? "success" : status === "refunded" ? "neutral" : "warning";
  const label = status === "paid" ? "Paid" : status === "refunded" ? "Refunded" : "Unpaid";
  return <Badge tone={tone}>{label}</Badge>;
}
