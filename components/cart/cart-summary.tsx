"use client";

import type { ReactNode } from "react";
import type { CartItem } from "@/types/cart";
import { Price } from "@/components/ui/price";
import { Select, Label } from "@/components/ui/input";
import { cartTotals, FREE_DELIVERY_THRESHOLD } from "@/lib/cart/calculations";
import { NIGERIA_STATES } from "@/lib/utils/nigeria-states";
import { formatNaira } from "@/lib/utils/format-currency";

interface Props {
  items: CartItem[];
  deliveryState: string;
  onDeliveryStateChange?: (state: string) => void;
  /** When true the fee is final (checkout), otherwise it's an estimate (cart). */
  final?: boolean;
  children?: ReactNode;
  heading?: string;
}

export function CartSummary({ items, deliveryState, onDeliveryStateChange, final = false, children, heading = "Order summary" }: Props) {
  const totals = cartTotals(items, deliveryState);
  const remaining = FREE_DELIVERY_THRESHOLD - totals.subtotal;

  return (
    <section aria-labelledby="summary-heading" className="rounded-lg border border-stone bg-white p-6">
      <h2 id="summary-heading" className="font-display text-xl font-medium">{heading}</h2>

      {onDeliveryStateChange && (
        <div className="mt-5">
          <Label htmlFor="delivery-state" className="text-xs uppercase tracking-[0.12em] text-mute">Deliver to</Label>
          <Select id="delivery-state" value={deliveryState} onChange={(e) => onDeliveryStateChange(e.target.value)} className="h-10 text-sm">
            {NIGERIA_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </div>
      )}

      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-mute">Subtotal ({totals.itemCount} {totals.itemCount === 1 ? "item" : "items"})</dt>
          <dd><Price amount={totals.subtotal} className="font-medium" /></dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-mute">{final ? "Delivery" : "Estimated delivery"}{deliveryState ? ` · ${deliveryState}` : ""}</dt>
          <dd>{totals.deliveryFee === 0 ? <span className="font-medium text-success">Free</span> : <Price amount={totals.deliveryFee} className="font-medium" />}</dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-stone pt-3 text-base">
          <dt className="font-medium">Total</dt>
          <dd><Price amount={totals.total} className="font-display text-xl font-semibold" /></dd>
        </div>
      </dl>

      {remaining > 0 && totals.subtotal > 0 && (
        <p className="mt-4 rounded-md bg-cream px-3 py-2 text-xs leading-relaxed text-charcoal-600">
          Add <strong>{formatNaira(remaining)}</strong> more for free delivery.
        </p>
      )}
      {!final && <p className="mt-3 text-xs text-mute">Final delivery fee is confirmed at checkout. Payment is made on delivery.</p>}

      {children && <div className="mt-6">{children}</div>}
    </section>
  );
}
