import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { requireServerEnv } from "@/lib/env";
import { logger } from "@/lib/utils/logger";

/**
 * Minimal Paystack API client (https://paystack.com/docs/api/). fetch + secret key, server only.
 * Test keys (sk_test_…) and live keys (sk_live_…) use the same endpoints.
 */

const BASE = "https://api.paystack.co";

export class PaystackError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

/** Naira → kobo, as an integer. Totals are stored as numeric(12,2). */
export function toKobo(naira: number): number {
  return Math.round(naira * 100);
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${requireServerEnv("PAYSTACK_SECRET_KEY")}`,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
      signal: controller.signal,
      cache: "no-store",
    });
    const body = (await res.json().catch(() => null)) as { status?: boolean; message?: string; data?: T } | null;
    if (!res.ok || !body?.status) {
      logger.error("paystack.request_failed", { path: path.split("?")[0], status: res.status, message: body?.message ?? "no body" });
      throw new PaystackError(body?.message ?? `Paystack responded ${res.status}`, res.status);
    }
    return body.data as T;
  } finally {
    clearTimeout(timer);
  }
}

export interface InitializeParams {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}

export interface InitializeResult {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export function initializeTransaction(p: InitializeParams): Promise<InitializeResult> {
  return call<InitializeResult>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: p.email,
      amount: String(p.amountKobo),
      currency: "NGN",
      reference: p.reference,
      callback_url: p.callbackUrl,
      metadata: p.metadata,
    }),
  });
}

export interface VerifiedTransaction {
  id: number;
  status: "success" | "failed" | "abandoned" | "ongoing" | "pending" | "processing" | "queued" | "reversed";
  reference: string;
  amount: number;
  currency: string;
  channel: string | null;
  gateway_response: string | null;
  paid_at: string | null;
}

export function verifyTransaction(reference: string): Promise<VerifiedTransaction> {
  return call<VerifiedTransaction>(`/transaction/verify/${encodeURIComponent(reference)}`);
}

/** Paystack signs webhook bodies with HMAC-SHA512 of the raw body using the secret key. */
export function isValidWebhookSignature(rawBody: string, signature: string | null, secret = requireServerEnv("PAYSTACK_SECRET_KEY")): boolean {
  if (!signature) return false;
  const expected = createHmac("sha512", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}
