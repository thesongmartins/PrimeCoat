"use client";

import { useState } from "react";
import type { CartItem } from "@/types/cart";
import type { CheckoutInput } from "@/lib/validations/checkout";
import { CheckoutForm } from "./checkout-form";
import { OrderSummary } from "./order-summary";

interface Props {
  items: CartItem[];
  initialDeliveryState: string;
  defaults: Partial<Pick<CheckoutInput, "fullName" | "email" | "phone">>;
  lockEmail: boolean;
}

/** Holds the selected state so the summary's delivery estimate follows the form. */
export function CheckoutView({ items, initialDeliveryState, defaults, lockEmail }: Props) {
  const [deliveryState, setDeliveryState] = useState(initialDeliveryState);
  return (
    <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-16">
      <div className="order-2 lg:order-1 lg:col-span-7">
        <CheckoutForm
          defaults={defaults}
          lockEmail={lockEmail}
          deliveryState={deliveryState}
          onDeliveryStateChange={setDeliveryState}
          cartIsEmpty={items.length === 0}
        />
      </div>
      <aside className="order-1 lg:order-2 lg:col-span-5">
        <div className="lg:sticky lg:top-24">
          <OrderSummary items={items} deliveryState={deliveryState} />
        </div>
      </aside>
    </div>
  );
}
