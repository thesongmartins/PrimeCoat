import type { Metadata } from "next";
import { CheckCircle2, Mail } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Order confirmed", robots: { index: false } };

/**
 * Phase 2: shell keyed by the order number in the URL.
 * Phase 6 fetches the order (RLS-scoped) and renders the full receipt here.
 */
export default async function ConfirmationPage(props: PageProps<"/checkout/confirmation/[orderNumber]">) {
  const { orderNumber } = await props.params;
  const sp = await props.searchParams;
  const emailFailed = sp.email === "failed";

  return (
    <Container className="max-w-3xl py-14 sm:py-20">
      <div className="text-center">
        <CheckCircle2 className="mx-auto size-12 text-success" aria-hidden="true" />
        <p className="eyebrow mt-6">Order confirmed</p>
        <h1 className="mt-3 font-display text-4xl font-medium">Thank you for your order</h1>
        <p className="mt-3 text-mute">
          Your order number is <strong className="font-semibold text-charcoal">{decodeURIComponent(orderNumber)}</strong>.
        </p>
      </div>

      <div className={`mt-10 flex gap-4 rounded-lg border p-5 ${emailFailed ? "border-ochre/50 bg-ochre-100" : "border-stone bg-white"}`}>
        <Mail className="mt-0.5 size-5 shrink-0 text-terracotta" aria-hidden="true" />
        <p className="text-sm leading-relaxed text-charcoal-600">
          {emailFailed
            ? "Your order was saved, but we could not send the confirmation email just now. You can view the full receipt in your account at any time."
            : "A confirmation email with your receipt is on its way. We will call to confirm a delivery time, and you pay the driver on arrival."}
        </p>
      </div>

      <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
        <ButtonLink href="/orders" size="lg">View my orders</ButtonLink>
        <ButtonLink href="/shop" size="lg" variant="outline">Continue shopping</ButtonLink>
      </div>
    </Container>
  );
}
