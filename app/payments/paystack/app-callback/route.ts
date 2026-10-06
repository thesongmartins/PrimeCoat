import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { APP_PAYMENT_RESULT_URL, finalizePaystackPayment } from "@/lib/payments/paystack";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Same as ../callback, for payments started in the mobile app: Paystack returns here
 * (?reference=…, or ?reference=…&cancelled=1 from its cancel button), we verify with Paystack,
 * then hand the in-app browser back to the app at primecoat://payment-result.
 * The app re-reads the order itself; the status here only chooses its wording.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const reference = params.get("reference") ?? params.get("trxref");
  const result = new URL(APP_PAYMENT_RESULT_URL);

  if (reference && reference.length <= 100) {
    const outcome = await finalizePaystackPayment(reference);
    const admin = createAdminClient();
    const { data } = await admin.from("payments").select("order_id").eq("reference", reference).maybeSingle();
    if (data?.order_id) result.searchParams.set("orderId", data.order_id);
    const status = outcome.state === "paid" ? "success" : params.get("cancelled") === "1" ? "cancelled" : outcome.state;
    result.searchParams.set("status", status);
  } else {
    result.searchParams.set("status", "failed");
  }

  // Arrives as primecoat://payment-result/?… (Next normalises the path); the app accepts both.
  return NextResponse.redirect(result.toString());
}
