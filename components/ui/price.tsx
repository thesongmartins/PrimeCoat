import { formatNaira } from "@/lib/utils/format-currency";
import { cn } from "@/lib/utils/cn";

export function Price({ amount, className }: { amount: number; className?: string }) {
  return (
    <span className={cn("tabular-nums tracking-tight", className)}>
      {formatNaira(amount)}
    </span>
  );
}
