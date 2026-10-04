import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/** Count is read from Supabase by the (server) header. */
export function CartBadge({ count, className }: { count: number; className?: string }) {
  return (
    <Link
      href="/cart"
      className={cn("relative grid size-10 place-items-center rounded-md text-charcoal transition-colors hover:bg-stone-200", className)}
      aria-label={count > 0 ? `Cart, ${count} ${count === 1 ? "item" : "items"}` : "Cart, empty"}
    >
      <ShoppingBag className="size-5" aria-hidden="true" />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-terracotta px-1 text-[0.6875rem] font-semibold leading-5 text-warm-white"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
