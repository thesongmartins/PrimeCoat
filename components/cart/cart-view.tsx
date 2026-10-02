"use client";

import Link from "next/link";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/lib/cart/store";
import { CartLine } from "./cart-line";
import { CartSummary } from "./cart-summary";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function CartView() {
  const { items, deliveryState, hasHydrated, setQuantity, removeItem, setDeliveryState } = useCartStore();

  if (!hasHydrated) {
    return (
      <div className="grid gap-10 lg:grid-cols-12" aria-busy="true" aria-label="Loading cart">
        <div className="space-y-6 lg:col-span-8">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="grid grid-cols-[112px_1fr] gap-6">
              <Skeleton className="aspect-square" />
              <div className="space-y-3">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-9 w-32" />
              </div>
            </div>
          ))}
        </div>
        <Skeleton className="h-72 lg:col-span-4" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag className="size-10" aria-hidden="true" />}
        title="Your cart is waiting for its first coat of colour."
        description="Browse our interior and exterior emulsions, primers and tools, and add what you need."
        action={
          <ButtonLink href="/shop" size="lg">
            Browse Paints
          </ButtonLink>
        }
      />
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <div className="lg:col-span-8">
        <ul className="divide-y divide-stone border-y border-stone">
          {items.map((item) => (
            <CartLine
              key={item.productId}
              item={item}
              onQuantityChange={(q) => setQuantity(item.productId, q)}
              onRemove={() => removeItem(item.productId)}
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
          <CartSummary items={items} deliveryState={deliveryState} onDeliveryStateChange={setDeliveryState}>
            <ButtonLink href="/checkout" size="lg" className="w-full">
              Proceed to Checkout
            </ButtonLink>
          </CartSummary>
        </div>
      </div>
    </div>
  );
}
