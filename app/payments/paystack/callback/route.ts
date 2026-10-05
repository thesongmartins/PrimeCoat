import { NextResponse, type NextRequest } from "next/server";
import { finalizePaystackPayment } from "@/lib/payments/paystack";
import { originFromRequest } from "@/lib/utils/origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Paystack sends the customer here after the hosted checkout (?reference=…&trxref=…).
 * We verify with Paystack's API before trusting anything, then show the confirmation page.
 * Deliberately outside the protected /checkout prefix so an expired session can't skip verification.
 */
export async function GET(request: NextRequest) {
  const origin = originFromRequest(request);
  const reference = request.nextUrl.searchParams.get("reference") ?? request.nextUrl.searchParams.get("trxref");
  if (!reference || reference.length > 100) return NextResponse.redirect(`${origin}/orders`);

  const outcome = await finalizePaystackPayment(reference);
  if (!outcome.orderNumber) return NextResponse.redirect(`${origin}/orders`);
  const status = outcome.state === "paid" ? "success" : outcome.state;
  return NextResponse.redirect(`${origin}/checkout/confirmation/${encodeURIComponent(outcome.orderNumber)}?payment=${status}`);
}
