import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { isPaystackConfigured } from "@/lib/env";
import { paymentClientFromRequest, startPaystackPayment, PaymentError } from "@/lib/payments/paystack";
import { originFromRequest } from "@/lib/utils/origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/orders/:id/pay — start (or retry) a Paystack payment for the caller's unpaid card order. */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/orders/[id]/pay">) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  if (!isPaystackConfigured()) return NextResponse.json({ error: "Card payment is not available right now." }, { status: 503 });
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  try {
    const { paymentUrl } = await startPaystackPayment(id, originFromRequest(request), paymentClientFromRequest(request));
    return NextResponse.json({ paymentUrl });
  } catch (err) {
    if (err instanceof PaymentError) return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
    return NextResponse.json({ error: "We couldn't start the payment." }, { status: 500 });
  }
}
