import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, Mail, AlertTriangle, Clock, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { OrderDetail } from "@/components/orders/order-detail";
import { PayNowButton } from "@/components/orders/pay-now-button";
import { getOrderByNumber } from "@/lib/orders/queries";
import { formatNaira } from "@/lib/utils/format-currency";
import { formatDateTime } from "@/lib/utils/dates";
import { getSuccessfulPayment } from "@/lib/payments/queries";

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
  const receipt = isCard && paid ? await getSuccessfulPayment(order.id) : null;
  const justPaid = paid && paymentParam === "success";

  const heading = awaitingCard ? "Your order is waiting for payment" : justPaid ? "Payment successful" : `Thank you, ${firstName}`;
  const Icon = awaitingCard ? (paymentParam === "pending" ? Clock : AlertTriangle) : CheckCircle2;
  const iconClass = awaitingCard ? "text-[#8a6418]" : "text-success";

  let emailNote: string | null = null;
  if (!awaitingCard) {
    emailNote = emailFailed
      ? `We couldn't email your receipt to ${order.email} just now. This page and your order history are your receipt.`
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
        <p className="eyebrow mt-6">{awaitingCard ? "Payment needed" : paid ? (justPaid ? `Thank you, ${firstName}` : "Payment received") : "Order confirmed"}</p>
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
        <div className="mx-auto mt-10 max-w-2xl space-y-4">
          {paid && isCard && (
            <section aria-labelledby="payment-receipt" className="rounded-lg border border-success/30 bg-success-100 p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <h2 id="payment-receipt" className="font-medium text-success">
                    {formatNaira(receipt?.amount ?? order.total)} paid securely with Paystack
                  </h2>
                  <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                    <div className="min-w-0">
                      <dt className="text-charcoal-600">Paid with</dt>
                      <dd className="font-medium capitalize">{receipt?.channel ? receipt.channel.replace(/_/g, " ") : "Card"}</dd>
                    </div>
                    {(receipt?.paidAt ?? null) && (
                      <div className="min-w-0">
                        <dt className="text-charcoal-600">Paid on</dt>
                        <dd className="font-medium">{formatDateTime(receipt!.paidAt!)}</dd>
                      </div>
                    )}
                    {receipt && (
                      <div className="min-w-0 sm:col-span-2">
                        <dt className="text-charcoal-600">Payment reference</dt>
                        <dd className="break-all font-mono text-[0.8125rem] font-medium">{receipt.reference}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            </section>
          )}
          {emailNote && (
            <p className="flex items-start gap-2.5 px-1 text-sm leading-relaxed text-mute">
              {emailFailed ? <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> : <Mail className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
              <span className="min-w-0 break-words">{emailNote}</span>
            </p>
          )}
        </div>
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
