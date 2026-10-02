import type { Metadata } from "next";
import { Package } from "lucide-react";
import { AccountShell } from "@/components/account/account-shell";
import { OrderList } from "@/components/orders/order-list";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { getOrdersForCurrentUser } from "@/lib/orders/queries";

// Session-dependent: never prerender or cache.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Order history", robots: { index: false } };

export default async function OrdersPage() {
  const orders = await getOrdersForCurrentUser();
  return (
    <AccountShell title="Order history" description="Every order you have placed with PrimeCoat, newest first.">
      {orders.length ? (
        <OrderList orders={orders} />
      ) : (
        <EmptyState
          icon={<Package className="size-10" aria-hidden="true" />}
          title="No orders yet"
          description="When you place an order it will appear here with its status and receipt."
          action={<ButtonLink href="/shop" size="lg">Browse Paints</ButtonLink>}
        />
      )}
    </AccountShell>
  );
}
