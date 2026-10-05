import Link from "next/link";
import type { OrderSummary } from "@/types/order";
import { OrderStatusBadge } from "./status-badge";
import { Price } from "@/components/ui/price";
import { formatDate } from "@/lib/utils/dates";
import { buttonVariants } from "@/components/ui/button";

export function OrderList({ orders }: { orders: OrderSummary[] }) {
  return (
    <>
      {/* Mobile: cards */}
      <ul className="space-y-3 md:hidden">
        {orders.map((o) => (
          <li key={o.id} className="rounded-lg border border-stone bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-sm font-semibold tracking-tight">{o.orderNumber}</p>
                <p className="mt-0.5 text-xs text-mute">{formatDate(o.createdAt)} · {o.itemCount} {o.itemCount === 1 ? "item" : "items"}</p>
              </div>
              <OrderStatusBadge status={o.status} awaitingPayment={o.paymentMethod === "card" && o.paymentStatus === "unpaid"} />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <Price amount={o.total} className="text-base font-semibold" />
              <Link href={`/orders/${o.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>View Order</Link>
            </div>
          </li>
        ))}
      </ul>

      {/* Desktop: table */}
      <div className="hidden overflow-hidden rounded-lg border border-stone bg-white md:block">
        <table className="w-full text-sm">
          <thead className="bg-cream text-left text-xs font-semibold uppercase tracking-[0.12em] text-mute">
            <tr>
              <th scope="col" className="px-5 py-3">Order</th>
              <th scope="col" className="px-5 py-3">Date</th>
              <th scope="col" className="px-5 py-3">Items</th>
              <th scope="col" className="px-5 py-3">Total</th>
              <th scope="col" className="px-5 py-3">Status</th>
              <th scope="col" className="px-5 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-cream/50">
                <td className="px-5 py-4 font-mono font-semibold tracking-tight">{o.orderNumber}</td>
                <td className="px-5 py-4 text-mute">{formatDate(o.createdAt)}</td>
                <td className="px-5 py-4 text-mute">{o.itemCount}</td>
                <td className="px-5 py-4"><Price amount={o.total} className="font-medium" /></td>
                <td className="px-5 py-4"><OrderStatusBadge status={o.status} awaitingPayment={o.paymentMethod === "card" && o.paymentStatus === "unpaid"} /></td>
                <td className="px-5 py-4 text-right">
                  <Link href={`/orders/${o.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>View Order</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
