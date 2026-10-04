"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Check, ShoppingBag } from "lucide-react";
import type { Product } from "@/types/product";
import { addToCart } from "@/app/cart/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface Props {
  product: Product;
  quantity?: number;
  size?: "sm" | "md" | "lg";
  compact?: boolean;
  className?: string;
}

/** Adds to the signed-in user's Supabase cart. Signed-out users are sent to sign in and back. */
export function AddToCartButton({ product, quantity = 1, size = "md", compact = false, className }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const outOfStock = product.stockQuantity <= 0;

  useEffect(() => {
    if (!added && !error) return;
    const t = setTimeout(() => {
      setAdded(false);
      setError(null);
    }, 2500);
    return () => clearTimeout(t);
  }, [added, error]);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const res = await addToCart(product.id, quantity);
      if (res.ok) {
        setAdded(true);
        return;
      }
      if (res.code === "AUTH_REQUIRED") {
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      setError(res.error);
    });
  }

  const label = outOfStock ? "Out of stock" : error ? "Try again" : added ? "Added" : "Add to Cart";

  return (
    <Button
      type="button"
      size={size}
      variant={added ? "accent" : "primary"}
      disabled={outOfStock}
      loading={pending}
      onClick={handleClick}
      title={error ?? undefined}
      aria-label={compact ? `${label}: ${product.name}` : undefined}
      aria-live="polite"
      className={cn(compact && "px-3", className)}
    >
      {!pending && (added ? <Check className="size-4" aria-hidden="true" /> : <ShoppingBag className="size-4" aria-hidden="true" />)}
      <span className={cn(compact && "sr-only sm:not-sr-only")}>{label}</span>
    </Button>
  );
}
