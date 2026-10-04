import type { Metadata } from "next";
import { ShoppingBag } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { CartView } from "@/components/cart/cart-view";
import { getCurrentUser } from "@/lib/auth/session";
import { getCartForCurrentUser } from "@/lib/cart/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your cart", robots: { index: false } };

export default async function CartPage() {
  const user = await getCurrentUser();
  const cart = user ? await getCartForCurrentUser() : null;

  return (
    <Container className="py-10 sm:py-14">
      <SectionHeading as="h1" eyebrow="Cart" title="Your cart" />
      <div className="mt-10">
        {cart ? (
          <CartView items={cart.items} deliveryState={cart.deliveryState} />
        ) : (
          <EmptyState
            icon={<ShoppingBag className="size-10" aria-hidden="true" />}
            title="Sign in to see your cart"
            description="Your cart is saved to your PrimeCoat account, so it follows you across devices."
            action={<ButtonLink href="/login?next=/cart" size="lg">Sign in</ButtonLink>}
          />
        )}
      </div>
    </Container>
  );
}
