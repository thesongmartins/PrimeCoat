import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface PaymentReceipt {
  reference: string;
  channel: string | null;
  paidAt: string | null;
  amount: number;
}

/** The successful Paystack payment for an order the caller owns (RLS: owner-only reads). */
export async function getSuccessfulPayment(orderId: string): Promise<PaymentReceipt | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payments")
    .select("reference, channel, paid_at, amount_kobo")
    .eq("order_id", orderId)
    .eq("status", "success")
    .order("paid_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return { reference: data.reference, channel: data.channel, paidAt: data.paid_at, amount: Number(data.amount_kobo) / 100 };
}
