"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import type { CartItem } from "@/types/cart";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { Price } from "@/components/ui/price";
import { ColourSwatch } from "@/components/ui/colour-swatch";
import { lineSubtotal } from "@/lib/cart/calculations";

interface Props {
  item: CartItem;
  onQuantityChange: (qty: number) => void;
  onRemove: () => void;
}

export function CartLine({ item, onQuantityChange, onRemove }: Props) {
  return (
    <li className="grid grid-cols-[88px_1fr] gap-4 py-6 sm:grid-cols-[112px_1fr_auto] sm:gap-6">
      <Link href={`/products/${item.slug}`} className="block overflow-hidden rounded-md bg-cream">
        <Image src={item.imageUrl} alt="" width={224} height={224} className="aspect-square w-full object-cover" />
      </Link>
      <div className="min-w-0">
        <h3 className="font-display text-lg font-medium leading-snug">
          <Link href={`/products/${item.slug}`} className="hover:text-terracotta-700">{item.name}</Link>
        </h3>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-mute">
          {item.colourName && <ColourSwatch hex={item.colourHex} name={item.colourName} />}
          {item.size && <span>{item.size}</span>}
          <span><Price amount={item.price} /> each</span>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 sm:hidden">
          <QuantityStepper value={item.quantity} max={item.stockQuantity} onChange={onQuantityChange} size="sm" label={`Quantity for ${item.name}`} />
          <Price amount={lineSubtotal(item)} className="ml-auto text-base font-semibold" />
        </div>
        <div className="mt-3 flex items-center gap-4 sm:mt-4">
          <div className="hidden sm:block">
            <QuantityStepper value={item.quantity} max={item.stockQuantity} onChange={onQuantityChange} size="sm" label={`Quantity for ${item.name}`} />
          </div>
          <button type="button" onClick={onRemove} className="inline-flex items-center gap-1.5 text-sm text-mute hover:text-danger" aria-label={`Remove ${item.name} from cart`}>
            <Trash2 className="size-4" aria-hidden="true" /> Remove
          </button>
        </div>
      </div>
      <div className="hidden text-right sm:block">
        <Price amount={lineSubtotal(item)} className="text-base font-semibold" />
      </div>
    </li>
  );
}
