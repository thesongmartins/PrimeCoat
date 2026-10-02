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

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={TONES[status]}>{ORDER_STATUS_LABELS[status]}</Badge>;
}
