import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/utils/logger";

/**
 * Records the outcome of the confirmation email on the order.
 * Uses the service role because clients have no update policy on orders (by design).
 * Failures here are logged and swallowed — the order already exists.
 */
export async function markOrderEmailStatus(orderId: string, status: "sent" | "failed", errorMessage?: string): Promise<void> {
  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("orders")
      .update({
        confirmation_email_status: status,
        confirmation_email_sent_at: status === "sent" ? new Date().toISOString() : null,
        confirmation_email_error: status === "failed" ? (errorMessage ?? "unknown").slice(0, 500) : null,
      })
      .eq("id", orderId);
    if (error) logger.error("orders.mark_email_status_failed", { orderId, message: error.message });
  } catch (err) {
    logger.error("orders.mark_email_status_threw", { orderId, message: err instanceof Error ? err.message : String(err) });
  }
}
