import { Badge } from "./badge";
import { getStockStatus, STOCK_LABELS } from "@/types/product";

export function StockBadge({ stockQuantity }: { stockQuantity: number }) {
  const status = getStockStatus(stockQuantity);
  const tone = status === "in_stock" ? "success" : status === "low_stock" ? "warning" : "danger";
  return (
    <Badge tone={tone}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {status === "low_stock" ? `Only ${stockQuantity} left` : STOCK_LABELS[status]}
    </Badge>
  );
}
