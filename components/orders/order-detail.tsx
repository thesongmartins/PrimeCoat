import Image from "next/image";
import type { Order } from "@/types/order";
import { PAYMENT_METHOD_LABELS } from "@/types/order";
import { OrderStatusBadge } from "./status-badge";
import { Price } from "@/components/ui/price";
import { formatDateTime } from "@/lib/utils/dates";

export function OrderDetail({ order }: { order: Order }) {
  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <section className="lg:col-span-8" aria-labelledby="items-heading">
        <div className="rounded-lg border border-stone bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone px-5 py-4">
            <h2 id="items-heading" className="font-display text-xl font-medium">Items</h2>
            <OrderStatusBadge status={order.status} />
          </div>
          <ul className="divide-y divide-stone">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-4 px-5 py-4">
                <Image src={item.productImageUrl ?? "/images/products/placeholder.svg"} alt="" width={64} height={64} className="size-16 shrink-0 rounded-md bg-cream object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-sm text-mute">Qty {item.quantity} × <Price amount={item.unitPrice} /></p>
                </div>
                <Price amount={item.subtotal} className="font-medium" />
              </li>
            ))}
          </ul>
          <dl className="space-y-2 border-t border-stone px-5 py-4 text-sm">
            <div className="flex justify-between"><dt className="text-mute">Subtotal</dt><dd><Price amount={order.subtotal} /></dd></div>
            <div className="flex justify-between"><dt className="text-mute">Delivery</dt><dd>{order.deliveryFee === 0 ? <span className="text-success">Free</span> : <Price amount={order.deliveryFee} />}</dd></div>
            <div className="flex justify-between border-t border-stone pt-2 text-base font-medium"><dt>Total</dt><dd><Price amount={order.total} className="font-display text-xl font-semibold" /></dd></div>
          </dl>
        </div>
      </section>

      <aside className="space-y-4 lg:col-span-4">
        <section className="rounded-lg border border-stone bg-white p-5" aria-labelledby="order-info">
          <h2 id="order-info" className="text-xs font-semibold uppercase tracking-[0.14em] text-mute">Order information</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-mute">Order number</dt><dd className="font-mono font-semibold">{order.orderNumber}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-mute">Placed</dt><dd>{formatDateTime(order.createdAt)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-mute">Payment</dt><dd>{PAYMENT_METHOD_LABELS[order.paymentMethod]}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-mute">Payment status</dt><dd className="capitalize">{order.paymentStatus}</dd></div>
          </dl>
        </section>
        <section className="rounded-lg border border-stone bg-white p-5" aria-labelledby="delivery-info">
          <h2 id="delivery-info" className="text-xs font-semibold uppercase tracking-[0.14em] text-mute">Delivery information</h2>
          <address className="mt-3 text-sm not-italic leading-relaxed">
            <p className="font-medium">{order.customerName}</p>
            <p>{order.deliveryAddress}</p>
            <p>{order.city}, {order.state}</p>
            <p className="mt-2 text-mute">{order.phone}</p>
            <p className="text-mute">{order.email}</p>
            {order.deliveryInstructions && <p className="mt-2 border-t border-stone pt-2 text-mute">“{order.deliveryInstructions}”</p>}
          </address>
        </section>
      </aside>
    </div>
  );
}
