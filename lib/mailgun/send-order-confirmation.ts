import "server-only";
import type { Order } from "@/types/order";
import { publicEnv } from "@/lib/env";
import { sendMail, type MailResult } from "./client";
import { renderOrderConfirmation } from "./templates/order-confirmation";

/** Renders and sends the branded confirmation for a committed order. Throws on failure. */
export async function sendOrderConfirmationEmail(order: Order): Promise<MailResult> {
  const rendered = renderOrderConfirmation(order, publicEnv.siteUrl);
  return sendMail({
    to: `${order.customerName} <${order.email}>`,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    tags: ["order-confirmation"],
    variables: { order_number: order.orderNumber, order_id: order.id },
  });
}
