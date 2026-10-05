"use client";

import { useState } from "react";
import type { CartItem } from "@/types/cart";
import type { CheckoutFormValues } from "@/lib/validations/checkout";
import { CheckoutForm } from "./checkout-form";
import { OrderSummary } from "./order-summary";

interface Props {
  items: CartItem[];
  initialDeliveryState: string;
  defaults: Partial<Pick<CheckoutFormValues, "fullName" | "email" | "phone">>;
  lockEmail: boolean;
  cardAvailable: boolean;
}

/** Holds the selected state so the summary's delivery estimate follows the form. */
export function CheckoutView({ items, initialDeliveryState, defaults, lockEmail, cardAvailable }: Props) {
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
          cardAvailable={cardAvailable}
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
