import { z } from "zod";
import { ORDER_STATUSES, type Order, type OrderItem, type OrderSummary } from "@/types/order";

export const orderItemRowSchema = z.object({
  id: z.uuid(),
  order_id: z.uuid(),
  product_id: z.uuid().nullable(),
  product_name: z.string(),
  product_image_url: z.string().nullable(),
  unit_price: z.coerce.number(),
  quantity: z.number().int(),
  subtotal: z.coerce.number(),
});

export const orderRowSchema = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  order_number: z.string(),
  customer_name: z.string(),
  email: z.string(),
  phone: z.string(),
  delivery_address: z.string(),
  city: z.string(),
  state: z.string(),
  delivery_instructions: z.string().nullable(),
  subtotal: z.coerce.number(),
  delivery_fee: z.coerce.number(),
  total: z.coerce.number(),
  status: z.enum(ORDER_STATUSES),
  payment_method: z.enum(["pay_on_delivery", "card", "bank_transfer"]),
  payment_status: z.enum(["unpaid", "paid", "refunded"]),
  confirmation_email_status: z.enum(["pending", "sent", "failed"]),
  created_at: z.string(),
});

export const orderWithItemsSchema = orderRowSchema.extend({
  order_items: z.array(orderItemRowSchema).default([]),
});

export const ORDER_COLUMNS =
  "id, user_id, order_number, customer_name, email, phone, delivery_address, city, state, delivery_instructions, subtotal, delivery_fee, total, status, payment_method, payment_status, confirmation_email_status, created_at";

export const ORDER_ITEM_COLUMNS = "id, order_id, product_id, product_name, product_image_url, unit_price, quantity, subtotal";

export function mapOrderItem(row: unknown): OrderItem {
  const r = orderItemRowSchema.parse(row);
  return {
    id: r.id,
    orderId: r.order_id,
    productId: r.product_id,
    productName: r.product_name,
    productImageUrl: r.product_image_url,
    unitPrice: r.unit_price,
    quantity: r.quantity,
    subtotal: r.subtotal,
  };
}

export function mapOrder(row: unknown): Order {
  const r = orderWithItemsSchema.parse(row);
  return {
    id: r.id,
    userId: r.user_id,
    orderNumber: r.order_number,
    customerName: r.customer_name,
    email: r.email,
    phone: r.phone,
    deliveryAddress: r.delivery_address,
    city: r.city,
    state: r.state,
    deliveryInstructions: r.delivery_instructions,
    subtotal: r.subtotal,
    deliveryFee: r.delivery_fee,
    total: r.total,
    status: r.status,
    paymentMethod: r.payment_method,
    paymentStatus: r.payment_status,
    confirmationEmailStatus: r.confirmation_email_status,
    createdAt: r.created_at,
    items: r.order_items.map(mapOrderItem),
  };
}

/** The create_order() RPC returns the order row with an `items` array (snake_case). */
export const createOrderResultSchema = orderRowSchema.extend({
  items: z.array(orderItemRowSchema).default([]),
});

export function mapCreateOrderResult(payload: unknown): Order {
  const r = createOrderResultSchema.parse(payload);
  const { items, ...rest } = r;
  return mapOrder({ ...rest, order_items: items });
}

const summaryRowSchema = z.object({
  id: z.uuid(),
  order_number: z.string(),
  total: z.coerce.number(),
  status: z.enum(ORDER_STATUSES),
  payment_method: z.enum(["pay_on_delivery", "card", "bank_transfer"]).default("pay_on_delivery"),
  payment_status: z.enum(["unpaid", "paid", "refunded"]).default("unpaid"),
  created_at: z.string(),
  order_items: z.array(z.object({ quantity: z.number().int() })).default([]),
});

export function mapOrderSummary(row: unknown): OrderSummary {
  const r = summaryRowSchema.parse(row);
  return {
    id: r.id,
    orderNumber: r.order_number,
    total: r.total,
    status: r.status,
    paymentMethod: r.payment_method,
    paymentStatus: r.payment_status,
    createdAt: r.created_at,
    itemCount: r.order_items.reduce((n, i) => n + i.quantity, 0),
  };
}
