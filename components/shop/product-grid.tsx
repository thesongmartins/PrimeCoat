import type { Product } from "@/types/product";
import { ProductCard } from "./product-card";
import { cn } from "@/lib/utils/cn";

export function ProductGrid({ products, className, priorityCount = 0 }: { products: Product[]; className?: string; priorityCount?: number }) {
  return (
    <ul className={cn("grid grid-cols-1 gap-x-6 gap-y-10 min-[360px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4", className)}>
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} priority={i < priorityCount} />
        </li>
      ))}
    </ul>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul className="grid grid-cols-1 gap-x-6 gap-y-10 min-[360px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="flex flex-col gap-3">
          <div className="aspect-square animate-pulse rounded-lg bg-stone" />
          <div className="h-3 w-1/3 animate-pulse rounded bg-stone" />
          <div className="h-5 w-3/4 animate-pulse rounded bg-stone" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-stone" />
        </li>
      ))}
    </ul>
  );
}
