import { NextResponse, type NextRequest } from "next/server";
import { placeOrderRequestSchema } from "@/lib/validations/checkout";
import { getCartForCurrentUser } from "@/lib/cart/queries";
import { getCurrentUser } from "@/lib/auth/session";
import { createOrderForCurrentUser, CreateOrderError } from "@/lib/orders/create-order";
import { sendOrderConfirmationEmail } from "@/lib/mailgun/send-order-confirmation";
import { markOrderEmailStatus } from "@/lib/orders/mark-email-status";
import { logger } from "@/lib/utils/logger";
import { isPaystackConfigured } from "@/lib/env";
import { startPaystackPayment, PaymentError } from "@/lib/payments/paystack";
import { originFromRequest } from "@/lib/utils/origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/orders
 * 1. Require a session.           → 401
 * 2. Validate the body with Zod.  → 400
 * 3. Load the cart from Supabase   → 400 if empty
 * 4. create_order() RPC (atomic, server-priced, empties the cart in the same transaction).
 * 4. Send the Mailgun confirmation AFTER commit; record its status; never roll back.
 * 5. Pay on delivery: send email now. Card: start a Paystack payment; the email is sent once paid.
 * 6. Respond { orderId, orderNumber, emailStatus?, paymentUrl? }.
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in to place an order." }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = placeOrderRequestSchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first ? `${first.path.join(".") || "form"}: ${first.message}` : "Invalid order details.", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  if (parsed.data.customer.paymentMethod === "card" && !isPaystackConfigured()) {
    return NextResponse.json({ error: "Card payment is not available right now. Please choose Pay on Delivery.", code: "CARD_UNAVAILABLE" }, { status: 400 });
  }

  const cart = await getCartForCurrentUser();
  if (cart.items.length === 0) {
    return NextResponse.json({ error: "Your cart is empty.", code: "CART_EMPTY" }, { status: 400 });
  }

  // The confirmation always goes to the verified account email, whatever the form said.
  const input = {
    customer: { ...parsed.data.customer, email: user.email || parsed.data.customer.email },
    items: cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
  };

  let order;
  try {
    order = await createOrderForCurrentUser(input);
  } catch (err) {
    if (err instanceof CreateOrderError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
    }
    logger.error("orders.route_unhandled", { message: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "We couldn't place your order right now. Please try again." }, { status: 500 });
  }

  logger.info("orders.created", { orderNumber: order.orderNumber, userId: user.id, total: order.total, method: order.paymentMethod });

  if (order.paymentMethod === "card") {
    // The order (and emptied cart) are committed. Hand off to Paystack; the confirmation email
    // is sent only after the payment is verified. If this hand-off fails the customer can retry
    // from the order page.
    try {
      const { paymentUrl } = await startPaystackPayment(order.id, originFromRequest(request));
      return NextResponse.json({ orderId: order.id, orderNumber: order.orderNumber, paymentUrl }, { status: 201 });
    } catch (err) {
      const message = err instanceof PaymentError ? err.message : "We couldn't start the payment.";
      return NextResponse.json({ orderId: order.id, orderNumber: order.orderNumber, paymentError: message }, { status: 201 });
    }
  }

  // Email is best-effort and must never create a duplicate order or fail the request.
  let emailStatus: "sent" | "failed" = "failed";
  try {
    await sendOrderConfirmationEmail(order);
    emailStatus = "sent";
    await markOrderEmailStatus(order.id, "sent");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("orders.email_failed", { orderNumber: order.orderNumber, message });
    await markOrderEmailStatus(order.id, "failed", message);
  }

  return NextResponse.json({ orderId: order.id, orderNumber: order.orderNumber, emailStatus }, { status: 201 });
}
