import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, Mail, AlertTriangle, Clock } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { OrderDetail } from "@/components/orders/order-detail";
import { PayNowButton } from "@/components/orders/pay-now-button";
import { getOrderByNumber } from "@/lib/orders/queries";
import { formatNaira } from "@/lib/utils/format-currency";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Order confirmation", robots: { index: false } };

/** RLS-scoped: only the owner can load the order, so a foreign order number is a 404. */
export default async function ConfirmationPage(props: PageProps<"/checkout/confirmation/[orderNumber]">) {
  const { orderNumber } = await props.params;
  const sp = await props.searchParams;
  const order = await getOrderByNumber(decodeURIComponent(orderNumber));
  if (!order) notFound();

  const firstName = order.customerName.split(" ")[0];
  const isCard = order.paymentMethod === "card";
  const paid = order.paymentStatus === "paid";
  const awaitingCard = isCard && !paid && order.status !== "cancelled";
  const paymentParam = typeof sp.payment === "string" ? sp.payment : undefined;
  const emailFailed = order.confirmationEmailStatus === "failed";

  const heading = awaitingCard ? "Your order is waiting for payment" : `Thank you, ${firstName}`;
  const Icon = awaitingCard ? (paymentParam === "pending" ? Clock : AlertTriangle) : CheckCircle2;
  const iconClass = awaitingCard ? "text-[#8a6418]" : "text-success";

  let emailNote: string | null = null;
  if (!awaitingCard) {
    emailNote = emailFailed
      ? `Your order is saved, but we could not send the confirmation email to ${order.email} just now. This page and your order history are your receipt.`
      : order.confirmationEmailStatus === "sent"
        ? `A confirmation email with this receipt has been sent to ${order.email}.`
        : `A confirmation email is on its way to ${order.email}.`;
  }

  const awaitingMessage =
    paymentParam === "pending"
      ? "Paystack is still processing your payment. This page will show it as paid once it's confirmed; you can refresh in a moment."
      : paymentParam === "cancelled"
        ? "You left the payment page before paying. Your order is saved, so you can pay whenever you're ready."
        : "The payment didn't go through. No money was taken. Your order is saved, so you can try again.";

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-2xl text-center">
        <Icon className={`mx-auto size-12 ${iconClass}`} aria-hidden="true" />
        <p className="eyebrow mt-6">{awaitingCard ? "Payment needed" : paid ? "Payment received" : "Order confirmed"}</p>
        <h1 className="mt-3 font-display text-4xl font-medium">{heading}</h1>
        <p className="mt-3 text-mute">
          Order <strong className="font-mono font-semibold text-charcoal">{order.orderNumber}</strong>
          {paid
            ? ` is paid (${formatNaira(order.total)}). We will call ${order.phone} to arrange delivery.`
            : awaitingCard
              ? ` · ${formatNaira(order.total)}`
              : `. We will call ${order.phone} to arrange delivery, and you pay the driver on arrival.`}
        </p>
      </div>

      {awaitingCard ? (
        <div className="mx-auto mt-10 max-w-2xl rounded-lg border border-ochre/50 bg-ochre-100 p-5">
          <p className="text-sm leading-relaxed text-charcoal-600" role="status">{awaitingMessage}</p>
          <PayNowButton orderId={order.id} className="mt-4" />
        </div>
      ) : (
        emailNote && (
          <div className={`mx-auto mt-10 flex max-w-2xl gap-4 rounded-lg border p-5 ${emailFailed ? "border-ochre/50 bg-ochre-100" : "border-stone bg-white"}`}>
            {emailFailed ? <AlertTriangle className="mt-0.5 size-5 shrink-0 text-[#8a6418]" aria-hidden="true" /> : <Mail className="mt-0.5 size-5 shrink-0 text-terracotta" aria-hidden="true" />}
            <p className="text-sm leading-relaxed text-charcoal-600">{emailNote}</p>
          </div>
        )
      )}

      <div className="mt-12">
        <OrderDetail order={order} />
      </div>

      <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
        <ButtonLink href="/orders" size="lg" variant={awaitingCard ? "outline" : "primary"}>View my orders</ButtonLink>
        <ButtonLink href="/shop" size="lg" variant="outline">Continue shopping</ButtonLink>
      </div>
    </Container>
  );
}
