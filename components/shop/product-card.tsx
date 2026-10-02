import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types/product";
import { CATEGORY_LABELS } from "@/types/product";
import { Price } from "@/components/ui/price";
import { StockBadge } from "@/components/ui/stock-badge";
import { ColourSwatch } from "@/components/ui/colour-swatch";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { cn } from "@/lib/utils/cn";

export function ProductCard({ product, priority = false, className }: { product: Product; priority?: boolean; className?: string }) {
  const href = `/products/${product.slug}`;
  return (
    <article className={cn("group flex flex-col", className)}>
      <Link href={href} className="relative block overflow-hidden rounded-lg bg-cream" aria-label={`View ${product.name}${product.colourName ? ` in ${product.colourName}` : ""}`}>
        <Image
          src={product.imageUrl}
          alt=""
          width={800}
          height={800}
          priority={priority}
          sizes="(min-width: 1280px) 300px, (min-width: 768px) 33vw, 50vw"
          className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute left-3 top-3">
          <StockBadge stockQuantity={product.stockQuantity} />
        </div>
      </Link>
      <div className="flex flex-1 flex-col pt-4">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-mute">
          {CATEGORY_LABELS[product.category]}
          {product.size ? <span className="font-normal normal-case tracking-normal"> · {product.size}</span> : null}
        </p>
        <h3 className="mt-1.5 font-display text-lg font-medium leading-snug">
          <Link href={href} className="hover:text-terracotta-700">
            {product.name}
          </Link>
        </h3>
        {product.colourName ? (
          <ColourSwatch hex={product.colourHex} name={product.colourName} className="mt-1.5" />
        ) : (
          <p className="mt-1.5 line-clamp-1 text-sm text-mute">{product.shortDescription}</p>
        )}
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <Price amount={product.price} className="text-base font-semibold" />
          <div className="flex items-center gap-2">
            <Link href={href} className="hidden text-sm font-medium text-charcoal-600 underline-offset-4 hover:underline sm:inline">
              Details
            </Link>
            <AddToCartButton product={product} size="sm" compact />
          </div>
        </div>
      </div>
    </article>
  );
}
