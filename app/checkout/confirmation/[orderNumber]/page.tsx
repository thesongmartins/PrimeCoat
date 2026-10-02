import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, Mail, AlertTriangle } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { OrderDetail } from "@/components/orders/order-detail";
import { getOrderByNumber } from "@/lib/orders/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Order confirmed", robots: { index: false } };

/** RLS-scoped: only the owner can load the order, so a foreign order number is a 404. */
export default async function ConfirmationPage(props: PageProps<"/checkout/confirmation/[orderNumber]">) {
  const { orderNumber } = await props.params;
  const order = await getOrderByNumber(decodeURIComponent(orderNumber));
  if (!order) notFound();

  const emailFailed = order.confirmationEmailStatus === "failed";

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-2xl text-center">
        <CheckCircle2 className="mx-auto size-12 text-success" aria-hidden="true" />
        <p className="eyebrow mt-6">Order confirmed</p>
        <h1 className="mt-3 font-display text-4xl font-medium">Thank you, {order.customerName.split(" ")[0]}</h1>
        <p className="mt-3 text-mute">
          Your order number is <strong className="font-mono font-semibold text-charcoal">{order.orderNumber}</strong>. We will call{" "}
          <span className="text-charcoal">{order.phone}</span> to arrange delivery, and you pay the driver on arrival.
        </p>
      </div>

      <div className={`mx-auto mt-10 flex max-w-2xl gap-4 rounded-lg border p-5 ${emailFailed ? "border-ochre/50 bg-ochre-100" : "border-stone bg-white"}`}>
        {emailFailed ? <AlertTriangle className="mt-0.5 size-5 shrink-0 text-[#8a6418]" aria-hidden="true" /> : <Mail className="mt-0.5 size-5 shrink-0 text-terracotta" aria-hidden="true" />}
        <p className="text-sm leading-relaxed text-charcoal-600">
          {emailFailed
            ? `Your order is saved, but we could not send the confirmation email to ${order.email} just now. This page and your order history are your receipt.`
            : `A confirmation email with this receipt has been sent to ${order.email}.`}
        </p>
      </div>

      <div className="mt-12">
        <OrderDetail order={order} />
      </div>

      <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
        <ButtonLink href="/orders" size="lg">View my orders</ButtonLink>
        <ButtonLink href="/shop" size="lg" variant="outline">Continue shopping</ButtonLink>
      </div>
    </Container>
  );
}
