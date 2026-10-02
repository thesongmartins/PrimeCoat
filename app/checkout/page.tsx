import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { OrderSummary } from "@/components/checkout/order-summary";

export const metadata: Metadata = { title: "Checkout" };

/**
 * Phase 2: renders the form with empty defaults.
 * Phase 3 adds the auth guard (proxy.ts) and passes the signed-in user's name/email.
 */
export default async function CheckoutPage() {
  return (
    <Container className="py-10 sm:py-14">
      <SectionHeading as="h1" eyebrow="Checkout" title="Delivery details" description="Confirm who we are delivering to and where. You pay when the order arrives." />
      <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="order-2 lg:order-1 lg:col-span-7">
          <CheckoutForm defaults={{}} />
        </div>
        <aside className="order-1 lg:order-2 lg:col-span-5">
          <div className="lg:sticky lg:top-24">
            <OrderSummary />
          </div>
        </aside>
      </div>
    </Container>
  );
}
