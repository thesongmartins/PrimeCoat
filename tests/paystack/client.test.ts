import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { isValidWebhookSignature, toKobo } from "@/lib/paystack/client";

describe("toKobo", () => {
  it("converts naira to integer kobo without float drift", () => {
    expect(toKobo(45100)).toBe(4510000);
    expect(toKobo(0.1 + 0.2)).toBe(30);
    expect(toKobo(18500.5)).toBe(1850050);
  });
});

describe("isValidWebhookSignature", () => {
  const secret = "sk_test_unit";
  const body = JSON.stringify({ event: "charge.success", data: { reference: "PC-1-abc" } });
  const sig = createHmac("sha512", secret).update(body).digest("hex");

  it("accepts Paystack's HMAC-SHA512 of the raw body", () => {
    expect(isValidWebhookSignature(body, sig, secret)).toBe(true);
  });
  it("rejects a tampered body, wrong secret, missing or malformed signature", () => {
    expect(isValidWebhookSignature(body.replace("abc", "xyz"), sig, secret)).toBe(false);
    expect(isValidWebhookSignature(body, sig, "sk_test_other")).toBe(false);
    expect(isValidWebhookSignature(body, null, secret)).toBe(false);
    expect(isValidWebhookSignature(body, "short", secret)).toBe(false);
  });
});
