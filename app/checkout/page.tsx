import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { OrderSummary } from "@/components/checkout/order-summary";
import { getCurrentUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/env";

// Session-dependent: never prerender or cache.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  if (!user && isSupabaseConfigured()) redirect("/login?next=/checkout");

  return (
    <Container className="py-10 sm:py-14">
      <SectionHeading as="h1" eyebrow="Checkout" title="Delivery details" description="Confirm who we are delivering to and where. You pay when the order arrives." />
      <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="order-2 lg:order-1 lg:col-span-7">
          <CheckoutForm
            defaults={{ fullName: user?.fullName ?? "", email: user?.email ?? "" }}
            lockEmail={Boolean(user?.email)}
          />
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
