import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { CartView } from "@/components/cart/cart-view";

export const metadata: Metadata = { title: "Your cart" };

export default function CartPage() {
  return (
    <Container className="py-10 sm:py-14">
      <SectionHeading as="h1" eyebrow="Cart" title="Your cart" />
      <div className="mt-10">
        <CartView />
      </div>
    </Container>
  );
}
