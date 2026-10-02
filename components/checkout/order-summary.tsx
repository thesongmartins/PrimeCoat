"use client";

import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/lib/cart/store";
import { CartSummary } from "@/components/cart/cart-summary";
import { Price } from "@/components/ui/price";
import { lineSubtotal } from "@/lib/cart/calculations";
import { Skeleton } from "@/components/ui/skeleton";
import { ButtonLink } from "@/components/ui/button";

export function OrderSummary() {
  const { items, deliveryState, hasHydrated } = useCartStore();

  if (!hasHydrated) return <Skeleton className="h-80" />;

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-stone bg-white p-6 text-center">
        <p className="font-display text-xl font-medium">Your cart is empty</p>
        <p className="mt-2 text-sm text-mute">Add some paint before checking out.</p>
        <ButtonLink href="/shop" className="mt-5">Browse Paints</ButtonLink>
      </div>
    );
  }

  return (
    <CartSummary items={items} deliveryState={deliveryState} final heading="Your order">
      <ul className="divide-y divide-stone border-t border-stone">
        {items.map((item) => (
          <li key={item.productId} className="flex items-center gap-4 py-3">
            <div className="relative shrink-0">
              <Image src={item.imageUrl} alt="" width={56} height={56} className="size-14 rounded-md bg-cream object-cover" />
              <span className="absolute -right-1.5 -top-1.5 grid min-w-5 place-items-center rounded-full bg-charcoal px-1 text-[0.6875rem] font-semibold text-warm-white" aria-hidden="true">{item.quantity}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                <Link href={`/products/${item.slug}`} className="hover:text-terracotta-700">{item.name}</Link>
              </p>
              <p className="text-xs text-mute">
                {[item.colourName, item.size].filter(Boolean).join(" · ")} · Qty {item.quantity} × <Price amount={item.price} />
              </p>
            </div>
            <Price amount={lineSubtotal(item)} className="text-sm font-medium" />
          </li>
        ))}
      </ul>
      <Link href="/cart" className="mt-4 inline-block text-sm font-medium text-charcoal-600 underline-offset-4 hover:underline">Edit cart</Link>
    </CartSummary>
  );
}
