import "server-only";
import type { Order } from "@/types/order";
import { requireServerEnv } from "@/lib/env";

/**
 * Phase 7 replaces this with the real Mailgun sender + template.
 * Until then it throws a clear error, so orders record `confirmation_email_status = 'failed'`
 * with a readable reason instead of silently pretending an email was sent.
 */
export async function sendOrderConfirmationEmail(order: Order): Promise<void> {
  void order;
  requireServerEnv("MAILGUN_API_KEY");
  throw new Error("Mailgun sender not implemented yet (Phase 7)");
}
