"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import type { CartItem } from "@/types/cart";
import { removeFromCart, setCartQuantity, setDeliveryState } from "@/app/cart/actions";
import { CartLine } from "./cart-line";
import { CartSummary } from "./cart-summary";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

/** Renders the Supabase cart. Every change is a server action; the page re-renders from the database. */
export function CartView({ items, deliveryState }: { items: CartItem[]; deliveryState: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (!res.ok) setError(res.error ?? "Something went wrong.");
    });
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag className="size-10" aria-hidden="true" />}
        title="Your cart is waiting for its first coat of colour."
        description="Browse our interior and exterior emulsions, primers and tools, and add what you need."
        action={<ButtonLink href="/shop" size="lg">Browse Paints</ButtonLink>}
      />
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <div className="lg:col-span-8">
        {error && (
          <p role="alert" className="mb-4 rounded-md border border-danger/30 bg-danger-100 px-4 py-3 text-sm text-danger">{error}</p>
        )}
        <ul className={cn("divide-y divide-stone border-y border-stone transition-opacity", pending && "opacity-60")} aria-busy={pending || undefined}>
          {items.map((item) => (
            <CartLine
              key={item.productId}
              item={item}
              onQuantityChange={(q) => run(() => setCartQuantity(item.productId, q))}
              onRemove={() => run(() => removeFromCart(item.productId))}
            />
          ))}
        </ul>
        <div className="mt-6">
          <Link href="/shop" className="inline-flex items-center gap-2 text-sm font-medium text-charcoal-600 hover:text-charcoal">
            <ArrowLeft className="size-4" aria-hidden="true" /> Continue shopping
          </Link>
        </div>
      </div>
      <div className="lg:col-span-4">
        <div className="lg:sticky lg:top-24">
          <CartSummary items={items} deliveryState={deliveryState} onDeliveryStateChange={(s) => run(() => setDeliveryState(s))}>
            <ButtonLink href="/checkout" size="lg" className={cn("w-full", pending && "pointer-events-none opacity-60")} aria-disabled={pending || undefined}>
              Proceed to Checkout
            </ButtonLink>
          </CartSummary>
        </div>
      </div>
    </div>
  );
}
