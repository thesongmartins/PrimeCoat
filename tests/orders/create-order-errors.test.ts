import { describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ rpc }) }));

import { createOrderForCurrentUser, CreateOrderError } from "@/lib/orders/create-order";

const input = {
  customer: { fullName: "Ada", email: "a@b.co", phone: "08031234567", deliveryAddress: "x street", city: "Lagos", state: "Lagos" as const, deliveryInstructions: "" },
  items: [{ productId: "a1000000-0000-4000-8000-000000000001", quantity: 1 }],
};

describe("createOrderForCurrentUser error mapping", () => {
  it.each([
    ["AUTH_REQUIRED", "42501", 401, "AUTH_REQUIRED"],
    ["CART_EMPTY", "22023", 400, "CART_EMPTY"],
    ["PRODUCT_UNAVAILABLE:abc", "22023", 409, "PRODUCT_UNAVAILABLE"],
    ["INSUFFICIENT_STOCK:Brush Set:3", "22023", 409, "INSUFFICIENT_STOCK"],
    ["CUSTOMER_INCOMPLETE", "22023", 400, "INVALID_INPUT"],
    ["something else entirely", "XX000", 500, "UNKNOWN"],
  ])("%s → %d %s", async (message, code, status, expectedCode) => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    rpc.mockResolvedValue({ data: null, error: { message, code } });
    await expect(createOrderForCurrentUser(input)).rejects.toMatchObject({ status, code: expectedCode });
  });

  it("surfaces the available quantity in the stock message", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "INSUFFICIENT_STOCK:Brush Set:3", code: "22023" } });
    await expect(createOrderForCurrentUser(input)).rejects.toThrow(/Only 3 of Brush Set are in stock/);
  });

  it("passes the payload through to the RPC and maps the result", async () => {
    rpc.mockResolvedValue({
      data: {
        id: "11111111-1111-4111-8111-111111111111", user_id: "22222222-2222-4222-8222-222222222222", order_number: "PC-20261002-0009", customer_name: "Ada", email: "a@b.co", phone: "08031234567",
        delivery_address: "x street", city: "Lagos", state: "Lagos", delivery_instructions: null, subtotal: 100, delivery_fee: 2500, total: 2600, status: "pending",
        payment_method: "pay_on_delivery", payment_status: "unpaid", confirmation_email_status: "pending", created_at: "2026-10-02T00:00:00Z", items: [],
      },
      error: null,
    });
    const order = await createOrderForCurrentUser(input);
    expect(rpc).toHaveBeenCalledWith("create_order", { p_customer: input.customer, p_items: input.items });
    expect(order.orderNumber).toBe("PC-20261002-0009");
    expect(order).toBeInstanceOf(Object);
    expect(CreateOrderError).toBeDefined();
  });
});
