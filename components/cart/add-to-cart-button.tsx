"use client";

import { useEffect, useState } from "react";
import { Check, ShoppingBag } from "lucide-react";
import type { Product } from "@/types/product";
import { useCartStore } from "@/lib/cart/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface Props {
  product: Product;
  quantity?: number;
  size?: "sm" | "md" | "lg";
  compact?: boolean;
  className?: string;
}

export function AddToCartButton({ product, quantity = 1, size = "md", compact = false, className }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);
  const outOfStock = product.stockQuantity <= 0;

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 1800);
    return () => clearTimeout(t);
  }, [added]);

  const label = outOfStock ? "Out of stock" : added ? "Added" : "Add to Cart";

  return (
    <Button
      type="button"
      size={size}
      variant={added ? "accent" : "primary"}
      disabled={outOfStock}
      onClick={() => {
        addItem(product, quantity);
        setAdded(true);
      }}
      aria-label={compact ? `${label}: ${product.name}` : undefined}
      aria-live="polite"
      className={cn(compact && "px-3", className)}
    >
      {added ? <Check className="size-4" aria-hidden="true" /> : <ShoppingBag className="size-4" aria-hidden="true" />}
      <span className={cn(compact && "sr-only sm:not-sr-only")}>{label}</span>
    </Button>
  );
}
