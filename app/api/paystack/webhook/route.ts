import { NextResponse, type NextRequest } from "next/server";
import { isValidWebhookSignature } from "@/lib/paystack/client";
import { finalizePaystackPayment } from "@/lib/payments/paystack";
import { isPaystackConfigured } from "@/lib/env";
import { logger } from "@/lib/utils/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Paystack webhook. Catches payments where the customer never returns to the site
 * (closed tab, lost connection). The signature proves it came from Paystack; we still
 * re-verify the transaction through the API inside finalizePaystackPayment().
 */
export async function POST(request: NextRequest) {
  if (!isPaystackConfigured()) return NextResponse.json({ ok: false }, { status: 503 });
  const raw = await request.text();
  if (!isValidWebhookSignature(raw, request.headers.get("x-paystack-signature"))) {
    logger.warn("paystack.webhook_bad_signature");
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let event: { event?: string; data?: { reference?: string } };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (event.event === "charge.success" && event.data?.reference) {
    const outcome = await finalizePaystackPayment(event.data.reference);
    logger.info("paystack.webhook_processed", { reference: event.data.reference, state: outcome.state });
  }
  // Always 200 for authentic events so Paystack doesn't retry ones we deliberately ignore.
  return NextResponse.json({ ok: true });
}
