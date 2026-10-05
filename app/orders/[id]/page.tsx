import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AccountShell } from "@/components/account/account-shell";
import { OrderDetail } from "@/components/orders/order-detail";
import { ButtonLink } from "@/components/ui/button";
import { getOrderById } from "@/lib/orders/queries";
import { reconcileOrderPaymentIfNeeded } from "@/lib/payments/paystack";

// Session-dependent: never prerender or cache.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Order details", robots: { index: false } };

export default async function OrderPage(props: PageProps<"/orders/[id]">) {
  const { id } = await props.params;
  await reconcileOrderPaymentIfNeeded({ id });
  const order = await getOrderById(id);
  if (!order) notFound();
  return (
    <AccountShell
      title={`Order ${order.orderNumber}`}
      action={
        <ButtonLink href="/orders" variant="ghost" size="sm">
          <ArrowLeft className="size-4" aria-hidden="true" /> All orders
        </ButtonLink>
      }
    >
      <OrderDetail order={order} />
    </AccountShell>
  );
}
