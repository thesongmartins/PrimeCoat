"use client";

import { useState } from "react";
import type { Product } from "@/types/product";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { Price } from "@/components/ui/price";
import { Truck } from "lucide-react";

export function ProductPurchasePanel({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);
  const outOfStock = product.stockQuantity <= 0;
  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {!outOfStock && <QuantityStepper value={qty} max={product.stockQuantity} onChange={setQty} />}
        <AddToCartButton product={product} quantity={qty} size="lg" className="hidden sm:inline-flex sm:min-w-56" />
      </div>
      <p className="mt-2 flex items-center gap-2 text-sm text-mute sm:mt-4">
        <Truck className="size-4" aria-hidden="true" />
        Pay on Delivery · Free delivery on orders over ₦150,000
      </p>

      {/* Sticky mobile bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t border-stone bg-warm-white/95 px-4 py-3 backdrop-blur sm:hidden">
        <div className="leading-tight">
          <p className="text-xs text-mute">{product.size ?? product.colourName ?? "Total"}</p>
          <Price amount={product.price * qty} className="text-base font-semibold" />
        </div>
        <AddToCartButton product={product} quantity={qty} />
      </div>
    </>
  );
}
