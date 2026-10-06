import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Order } from "@/types/order";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  createOrderForCurrentUser: vi.fn(),
  sendOrderConfirmationEmail: vi.fn(),
  markOrderEmailStatus: vi.fn(),
  getCartForCurrentUser: vi.fn(),
  startPaystackPayment: vi.fn(),
}));

vi.mock("@/lib/payments/paystack", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/payments/paystack")>();
  return {
    startPaystackPayment: mocks.startPaystackPayment,
    paymentClientFromRequest: actual.paymentClientFromRequest,
    PaymentError: class PaymentError extends Error {},
  };
});

vi.mock("@/lib/cart/queries", () => ({ getCartForCurrentUser: mocks.getCartForCurrentUser }));

vi.mock("@/lib/auth/session", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/lib/orders/create-order", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/orders/create-order")>();
  return { ...actual, createOrderForCurrentUser: mocks.createOrderForCurrentUser };
});
vi.mock("@/lib/mailgun/send-order-confirmation", () => ({ sendOrderConfirmationEmail: mocks.sendOrderConfirmationEmail }));
vi.mock("@/lib/orders/mark-email-status", () => ({ markOrderEmailStatus: mocks.markOrderEmailStatus }));

import { POST } from "@/app/api/orders/route";
import { CreateOrderError } from "@/lib/orders/create-order";
import { NextRequest } from "next/server";

const user = { id: "u1", email: "ada@example.com", fullName: "Ada", avatarUrl: null, createdAt: "2026-01-01" };
const body = {
  customer: { fullName: "Ada Okonkwo", email: "spoof@example.com", phone: "08031234567", deliveryAddress: "14 Bourdillon Road", city: "Lagos", state: "Lagos", deliveryInstructions: "" },
  // Ignored by the server: items come from the Supabase cart.
  items: [{ productId: "a1000000-0000-4000-8000-000000000099", quantity: 500, price: 1 }],
};
const serverCart = {
  deliveryState: "Lagos",
  items: [{ productId: "a1000000-0000-4000-8000-000000000001", slug: "s", name: "Velvet", price: 18500, imageUrl: "/i.svg", size: "4 L", colourName: null, colourHex: null, stockQuantity: 10, quantity: 2 }],
};
const order: Order = {
  id: "o1", userId: "u1", orderNumber: "PC-20261002-0001", customerName: "Ada Okonkwo", email: "ada@example.com", phone: "08031234567",
  deliveryAddress: "14 Bourdillon Road", city: "Lagos", state: "Lagos", deliveryInstructions: null, subtotal: 37000, deliveryFee: 2500, total: 39500,
  status: "pending", paymentMethod: "pay_on_delivery", paymentStatus: "unpaid", confirmationEmailStatus: "pending", createdAt: "2026-10-02T10:00:00Z", items: [],
};

const req = (json: unknown, raw = false) =>
  new NextRequest("http://localhost/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: raw ? (json as string) : JSON.stringify(json) });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCartForCurrentUser.mockResolvedValue(serverCart);
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
});

describe("POST /api/orders", () => {
  it("returns 401 without a session and never touches the database", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);
    const res = await POST(req(body));
    expect(res.status).toBe(401);
    expect(mocks.createOrderForCurrentUser).not.toHaveBeenCalled();
  });

  it("returns 400 for malformed JSON", async () => {
    mocks.getCurrentUser.mockResolvedValue(user);
    const res = await POST(req("{not json", true));
    expect(res.status).toBe(400);
  });

  it("returns 400 with the first validation issue", async () => {
    mocks.getCurrentUser.mockResolvedValue(user);
    const res = await POST(req({ ...body, customer: { ...body.customer, phone: "123" } }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("customer.phone");
    expect(mocks.createOrderForCurrentUser).not.toHaveBeenCalled();
  });

  it("creates the order with the account email (not the form email), sends the email, records sent", async () => {
    mocks.getCurrentUser.mockResolvedValue(user);
    mocks.createOrderForCurrentUser.mockResolvedValue(order);
    mocks.sendOrderConfirmationEmail.mockResolvedValue({ id: "<msg>", message: "Queued" });
    const res = await POST(req(body));
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ orderId: "o1", orderNumber: "PC-20261002-0001", emailStatus: "sent" });
    const input = mocks.createOrderForCurrentUser.mock.calls[0][0];
    expect(input.customer.email).toBe("ada@example.com");
    expect(input.items).toEqual([{ productId: "a1000000-0000-4000-8000-000000000001", quantity: 2 }]);
    expect(mocks.markOrderEmailStatus).toHaveBeenCalledWith("o1", "sent");
  });

  it("still returns 201 when the email fails, and records the failure", async () => {
    mocks.getCurrentUser.mockResolvedValue(user);
    mocks.createOrderForCurrentUser.mockResolvedValue(order);
    mocks.sendOrderConfirmationEmail.mockRejectedValue(new Error("Mailgun responded 403"));
    const res = await POST(req(body));
    expect(res.status).toBe(201);
    expect((await res.json()).emailStatus).toBe("failed");
    expect(mocks.markOrderEmailStatus).toHaveBeenCalledWith("o1", "failed", "Mailgun responded 403");
    expect(mocks.createOrderForCurrentUser).toHaveBeenCalledTimes(1);
  });

  it("maps domain errors to their status codes without sending email", async () => {
    mocks.getCurrentUser.mockResolvedValue(user);
    mocks.createOrderForCurrentUser.mockRejectedValue(new CreateOrderError("Only 3 left", 409, "INSUFFICIENT_STOCK"));
    const res = await POST(req(body));
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe("INSUFFICIENT_STOCK");
    expect(mocks.sendOrderConfirmationEmail).not.toHaveBeenCalled();
  });

  it("returns 400 when the Supabase cart is empty, without creating an order", async () => {
    mocks.getCurrentUser.mockResolvedValue(user);
    mocks.getCartForCurrentUser.mockResolvedValue({ items: [], deliveryState: "Lagos" });
    const res = await POST(req(body));
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe("CART_EMPTY");
    expect(mocks.createOrderForCurrentUser).not.toHaveBeenCalled();
  });

  it("card orders: no email at creation, returns the Paystack checkout URL", async () => {
    process.env.PAYSTACK_SECRET_KEY = "sk_test_x";
    mocks.getCurrentUser.mockResolvedValue(user);
    mocks.createOrderForCurrentUser.mockResolvedValue({ ...order, paymentMethod: "card" });
    mocks.startPaystackPayment.mockResolvedValue({ paymentUrl: "https://checkout.paystack.com/abc", reference: "PC-1-x" });
    const res = await POST(req({ ...body, customer: { ...body.customer, paymentMethod: "card" } }));
    expect(res.status).toBe(201);
    expect((await res.json()).paymentUrl).toBe("https://checkout.paystack.com/abc");
    expect(mocks.createOrderForCurrentUser.mock.calls[0][0].customer.paymentMethod).toBe("card");
    expect(mocks.sendOrderConfirmationEmail).not.toHaveBeenCalled();
    expect(mocks.startPaystackPayment.mock.calls[0][2]).toBe("web");
  });

  it("card orders from the mobile app return to the app after paying", async () => {
    process.env.PAYSTACK_SECRET_KEY = "sk_test_x";
    mocks.getCurrentUser.mockResolvedValue(user);
    mocks.createOrderForCurrentUser.mockResolvedValue({ ...order, paymentMethod: "card" });
    mocks.startPaystackPayment.mockResolvedValue({ paymentUrl: "https://checkout.paystack.com/abc", reference: "PC-1-x" });
    const appReq = new NextRequest("http://localhost/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-PrimeCoat-Client": "app" },
      body: JSON.stringify({ ...body, customer: { ...body.customer, paymentMethod: "card" } }),
    });
    expect((await POST(appReq)).status).toBe(201);
    expect(mocks.startPaystackPayment.mock.calls[0][2]).toBe("app");
  });

  it("card orders: rejected up front when Paystack isn't configured", async () => {
    delete process.env.PAYSTACK_SECRET_KEY;
    mocks.getCurrentUser.mockResolvedValue(user);
    const res = await POST(req({ ...body, customer: { ...body.customer, paymentMethod: "card" } }));
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe("CARD_UNAVAILABLE");
    expect(mocks.createOrderForCurrentUser).not.toHaveBeenCalled();
  });

  it("card orders: keeps the order and reports when Paystack can't be reached", async () => {
    process.env.PAYSTACK_SECRET_KEY = "sk_test_x";
    mocks.getCurrentUser.mockResolvedValue(user);
    mocks.createOrderForCurrentUser.mockResolvedValue({ ...order, paymentMethod: "card" });
    mocks.startPaystackPayment.mockRejectedValue(new Error("down"));
    const res = await POST(req({ ...body, customer: { ...body.customer, paymentMethod: "card" } }));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.orderNumber).toBe("PC-20261002-0001");
    expect(json.paymentError).toBeTruthy();
  });

  it("returns 500 for unexpected failures", async () => {
    mocks.getCurrentUser.mockResolvedValue(user);
    mocks.createOrderForCurrentUser.mockRejectedValue(new Error("boom"));
    const res = await POST(req(body));
    expect(res.status).toBe(500);
  });
});
