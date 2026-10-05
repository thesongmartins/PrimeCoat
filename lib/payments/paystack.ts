import "server-only";
import { randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { initializeTransaction, toKobo, verifyTransaction, PaystackError } from "@/lib/paystack/client";
import { getOrderById } from "@/lib/orders/queries";
import { mapOrder, ORDER_COLUMNS, ORDER_ITEM_COLUMNS } from "@/lib/orders/mappers";
import { sendOrderConfirmationEmail } from "@/lib/mailgun/send-order-confirmation";
import { markOrderEmailStatus } from "@/lib/orders/mark-email-status";
import { logger } from "@/lib/utils/logger";

/**
 * Paystack payment lifecycle.
 *  start:    owner-only (RLS read of the order) → record attempt → initialize → hosted checkout URL
 *  finalize: verify with Paystack's API (never trust the redirect or webhook body alone) →
 *            finalize_paystack_payment() marks the order paid exactly once → send confirmation email.
 * Payment rows are written with the service role; clients can only read their own.
 */

export class PaymentError extends Error {
  constructor(message: string, public readonly status: number, public readonly code: string) {
    super(message);
  }
}

export function newReference(orderNumber: string): string {
  return `${orderNumber}-${randomBytes(4).toString("hex")}`;
}

export async function startPaystackPayment(orderId: string, origin: string): Promise<{ paymentUrl: string; reference: string }> {
  // Loaded through the user's session, so RLS guarantees they own it.
  const order = await getOrderById(orderId);
  if (!order) throw new PaymentError("Order not found.", 404, "NOT_FOUND");
  if (order.paymentMethod !== "card") throw new PaymentError("This order is paid on delivery.", 409, "NOT_CARD");
  if (order.paymentStatus === "paid") throw new PaymentError("This order is already paid.", 409, "ALREADY_PAID");
  if (order.status === "cancelled") throw new PaymentError("This order was cancelled.", 409, "CANCELLED");

  const reference = newReference(order.orderNumber);
  const amountKobo = toKobo(order.total);
  const admin = createAdminClient();
  const { error: insertError } = await admin.from("payments").insert({
    order_id: order.id,
    user_id: order.userId,
    reference,
    amount_kobo: amountKobo,
    currency: "NGN",
  });
  if (insertError) {
    logger.error("payments.record_attempt_failed", { orderNumber: order.orderNumber, message: insertError.message });
    throw new PaymentError("We couldn't start the payment. Please try again.", 500, "RECORD_FAILED");
  }

  try {
    const init = await initializeTransaction({
      email: order.email,
      amountKobo,
      reference,
      callbackUrl: `${origin}/checkout/paystack/callback`,
      metadata: {
        order_id: order.id,
        order_number: order.orderNumber,
        cancel_action: `${origin}/checkout/confirmation/${encodeURIComponent(order.orderNumber)}?payment=cancelled`,
      },
    });
    logger.info("payments.initialized", { orderNumber: order.orderNumber, reference });
    return { paymentUrl: init.authorization_url, reference };
  } catch (err) {
    await admin.from("payments").update({ status: "failed", gateway_response: "initialize_failed" }).eq("reference", reference);
    const message = err instanceof PaystackError ? err.message : "Payment service unavailable";
    logger.error("payments.initialize_failed", { orderNumber: order.orderNumber, message });
    throw new PaymentError("We couldn't reach the payment provider. Your order is saved; please try paying again.", 502, "PROVIDER_ERROR");
  }
}

export type FinalizeOutcome =
  | { state: "paid"; orderNumber: string; newlyPaid: boolean }
  | { state: "pending" | "failed"; orderNumber: string | null };

async function orderNumberFor(reference: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin.from("payments").select("orders(order_number)").eq("reference", reference).maybeSingle();
  const rel = (data as { orders?: { order_number?: string } | null } | null)?.orders;
  return rel?.order_number ?? null;
}

/** Idempotent. Safe to call from both the browser callback and the webhook. */
export async function finalizePaystackPayment(reference: string): Promise<FinalizeOutcome> {
  const admin = createAdminClient();
  const { data: attempt } = await admin.from("payments").select("id, status").eq("reference", reference).maybeSingle();
  if (!attempt) {
    logger.warn("payments.unknown_reference", { reference });
    return { state: "failed", orderNumber: null };
  }

  let tx;
  try {
    tx = await verifyTransaction(reference);
  } catch {
    return { state: "pending", orderNumber: await orderNumberFor(reference) };
  }

  if (tx.status !== "success") {
    if (tx.status === "failed" || tx.status === "abandoned") {
      await admin.from("payments").update({ status: tx.status, gateway_response: tx.gateway_response }).eq("reference", reference).neq("status", "success");
      return { state: "failed", orderNumber: await orderNumberFor(reference) };
    }
    return { state: "pending", orderNumber: await orderNumberFor(reference) };
  }

  const { data, error } = await admin.rpc("finalize_paystack_payment", {
    p_reference: reference,
    p_amount_kobo: tx.amount,
    p_currency: tx.currency,
    p_transaction_id: String(tx.id),
    p_channel: tx.channel ?? "",
    p_gateway_response: tx.gateway_response ?? "",
    p_paid_at: tx.paid_at ?? new Date().toISOString(),
  });
  if (error) {
    logger.error("payments.finalize_failed", { reference, message: error.message });
    return { state: "pending", orderNumber: await orderNumberFor(reference) };
  }
  const result = data as { order_id: string; newly_paid: boolean; error?: string };
  if (result.error === "AMOUNT_MISMATCH") {
    logger.error("payments.amount_mismatch", { reference, paidKobo: tx.amount });
    return { state: "failed", orderNumber: await orderNumberFor(reference) };
  }

  // Load the now-paid order (service role, by id from our own payment row) for the email.
  const { data: row } = await admin
    .from("orders")
    .select(`${ORDER_COLUMNS}, order_items(${ORDER_ITEM_COLUMNS})`)
    .eq("id", result.order_id)
    .single();
  const order = mapOrder(row);

  if (result.newly_paid) {
    logger.info("payments.paid", { orderNumber: order.orderNumber, reference });
    try {
      await sendOrderConfirmationEmail(order);
      await markOrderEmailStatus(order.id, "sent");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error("orders.email_failed", { orderNumber: order.orderNumber, message });
      await markOrderEmailStatus(order.id, "failed", message);
    }
  }
  return { state: "paid", orderNumber: order.orderNumber, newlyPaid: result.newly_paid };
}
