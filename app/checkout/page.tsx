import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { CheckoutView } from "@/components/checkout/checkout-view";
import { getCurrentUser } from "@/lib/auth/session";
import { getCartForCurrentUser } from "@/lib/cart/queries";
import { isPaystackConfigured } from "@/lib/env";

// Session-dependent: never prerender or cache.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/checkout");
  const cart = await getCartForCurrentUser();

  return (
    <Container className="py-10 sm:py-14">
      <SectionHeading as="h1" eyebrow="Checkout" title="Delivery details" description="Confirm who we are delivering to and where, then choose how to pay." />
      <CheckoutView
        items={cart.items}
        initialDeliveryState={cart.deliveryState}
        defaults={{ fullName: user.fullName ?? "", email: user.email }}
        lockEmail={Boolean(user.email)}
        cardAvailable={isPaystackConfigured()}
      />
    </Container>
  );
}
