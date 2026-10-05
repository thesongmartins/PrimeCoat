"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Starts (or retries) a Paystack payment for an unpaid card order. */
export function PayNowButton({ orderId, size = "lg", className }: { orderId: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/pay`, { method: "POST" });
      const body = (await res.json().catch(() => null)) as { paymentUrl?: string; error?: string } | null;
      if (!res.ok || !body?.paymentUrl) throw new Error(body?.error ?? "We couldn't start the payment.");
      window.location.assign(body.paymentUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't start the payment.");
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <Button type="button" size={size} variant="accent" loading={loading} onClick={pay} className="w-full sm:w-auto">
        {!loading && <CreditCard className="size-4" aria-hidden="true" />}
        {loading ? "Opening secure payment…" : "Pay now"}
      </Button>
      {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
