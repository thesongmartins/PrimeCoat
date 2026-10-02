"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/lib/cart/store";
import { cartItemCount } from "@/lib/cart/calculations";
import { cn } from "@/lib/utils/cn";

export function CartBadge({ className }: { className?: string }) {
  const items = useCartStore((s) => s.items);
  const hydrated = useCartStore((s) => s.hasHydrated);
  const count = hydrated ? cartItemCount(items) : 0;
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
