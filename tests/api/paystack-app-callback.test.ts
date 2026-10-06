import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ finalize: vi.fn(), orderId: vi.fn() }));
vi.mock("@/lib/payments/paystack", () => ({
  APP_PAYMENT_RESULT_URL: "primecoat://payment-result",
  finalizePaystackPayment: mocks.finalize,
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: mocks.orderId() }) }) }) }),
  }),
}));

import { GET } from "@/app/payments/paystack/app-callback/route";

const get = async (query: string) => {
  const res = await GET(new NextRequest(`https://primecoat.test/payments/paystack/app-callback${query}`));
  return new URL(res.headers.get("location")!);
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.orderId.mockReturnValue({ order_id: "o1" });
});

describe("GET /payments/paystack/app-callback", () => {
  it("verifies the payment, then opens the app with the order and outcome", async () => {
    mocks.finalize.mockResolvedValue({ state: "paid", orderNumber: "PC-1", newlyPaid: true });
    const url = await get("?trxref=PC-1-a&reference=PC-1-a");
    expect(mocks.finalize).toHaveBeenCalledWith("PC-1-a");
    expect(`${url.protocol}//${url.host}`).toBe("primecoat://payment-result");
    expect(url.searchParams.get("orderId")).toBe("o1");
    expect(url.searchParams.get("status")).toBe("success");
  });

  it("reports a cancelled payment that wasn't completed", async () => {
    mocks.finalize.mockResolvedValue({ state: "pending", orderNumber: "PC-1" });
    const url = await get("?reference=PC-1-a&cancelled=1");
    expect(url.searchParams.get("status")).toBe("cancelled");
  });

  it("a cancel link can't hide a payment that actually went through", async () => {
    mocks.finalize.mockResolvedValue({ state: "paid", orderNumber: "PC-1", newlyPaid: false });
    const url = await get("?reference=PC-1-a&cancelled=1");
    expect(url.searchParams.get("status")).toBe("success");
  });

  it("returns a failure to the app without a reference", async () => {
    const url = await get("");
    expect(mocks.finalize).not.toHaveBeenCalled();
    expect(url.searchParams.get("status")).toBe("failed");
    expect(url.searchParams.get("orderId")).toBeNull();
  });
});
