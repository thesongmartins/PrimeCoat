import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const finalize = vi.hoisted(() => vi.fn());
vi.mock("@/lib/payments/paystack", () => ({ finalizePaystackPayment: finalize }));

import { POST } from "@/app/api/paystack/webhook/route";

const secret = "sk_test_webhook";
const req = (body: string, sig?: string) =>
  new NextRequest("http://localhost/api/paystack/webhook", { method: "POST", body, headers: sig ? { "x-paystack-signature": sig } : {} });
const sign = (b: string) => createHmac("sha512", secret).update(b).digest("hex");

beforeEach(() => {
  vi.clearAllMocks();
  process.env.PAYSTACK_SECRET_KEY = secret;
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
});

describe("POST /api/paystack/webhook", () => {
  it("rejects unsigned or wrongly signed requests without touching orders", async () => {
    const body = JSON.stringify({ event: "charge.success", data: { reference: "PC-1-a" } });
    expect((await POST(req(body))).status).toBe(401);
    expect((await POST(req(body, sign(body + "x")))).status).toBe(401);
    expect(finalize).not.toHaveBeenCalled();
  });

  it("finalizes on a signed charge.success", async () => {
    finalize.mockResolvedValue({ state: "paid", orderNumber: "PC-1", newlyPaid: true });
    const body = JSON.stringify({ event: "charge.success", data: { reference: "PC-1-a" } });
    const res = await POST(req(body, sign(body)));
    expect(res.status).toBe(200);
    expect(finalize).toHaveBeenCalledWith("PC-1-a");
  });

  it("acknowledges other signed events without finalizing", async () => {
    const body = JSON.stringify({ event: "transfer.success", data: { reference: "T-1" } });
    expect((await POST(req(body, sign(body)))).status).toBe(200);
    expect(finalize).not.toHaveBeenCalled();
  });
});
