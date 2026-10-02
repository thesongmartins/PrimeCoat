import { describe, expect, it } from "vitest";
import { mapCreateOrderResult, mapOrder, mapOrderSummary } from "@/lib/orders/mappers";
import { mapProduct } from "@/lib/products/mappers";

const orderRow = {
  id: "11111111-1111-4111-8111-111111111111",
  user_id: "22222222-2222-4222-8222-222222222222",
  order_number: "PC-20261002-0001",
  customer_name: "Ada",
  email: "ada@example.com",
  phone: "08031234567",
  delivery_address: "14 Bourdillon",
  city: "Lagos",
  state: "Lagos",
  delivery_instructions: null,
  subtotal: "42600.00",
  delivery_fee: "2500.00",
  total: "45100.00",
  status: "pending",
  payment_method: "pay_on_delivery",
  payment_status: "unpaid",
  confirmation_email_status: "failed",
  created_at: "2026-10-02T10:00:00Z",
};
const itemRow = { id: "33333333-3333-4333-8333-333333333333", order_id: orderRow.id, product_id: null, product_name: "Roller", product_image_url: "/x.svg", unit_price: "5600.00", quantity: 1, subtotal: "5600.00" };

describe("order mappers", () => {
  it("maps numeric strings from Postgres to numbers", () => {
    const o = mapOrder({ ...orderRow, order_items: [itemRow] });
    expect(o.total).toBe(45100);
    expect(o.items[0].unitPrice).toBe(5600);
    expect(o.confirmationEmailStatus).toBe("failed");
  });
  it("maps the RPC shape (items key)", () => {
    const o = mapCreateOrderResult({ ...orderRow, items: [itemRow] });
    expect(o.items).toHaveLength(1);
    expect(o.orderNumber).toBe("PC-20261002-0001");
  });
  it("counts items in summaries", () => {
    const s = mapOrderSummary({ id: orderRow.id, order_number: orderRow.order_number, total: "45100", status: "pending", created_at: orderRow.created_at, order_items: [{ quantity: 2 }, { quantity: 1 }] });
    expect(s.itemCount).toBe(3);
  });
  it("rejects malformed rows", () => {
    expect(() => mapOrder({ ...orderRow, status: "lost" })).toThrow();
  });
});

describe("product mapper", () => {
  it("maps snake_case rows to camelCase products", () => {
    const p = mapProduct({
      id: "a1000000-0000-4000-8000-000000000001", name: "Velvet", slug: "velvet", description: "d", short_description: "s", category: "interior",
      price: "18500.00", image_url: "/i.svg", size: "4 L", colour_name: "Sage", colour_hex: "#9AA88F", finish: "Matt", coverage: null,
      stock_quantity: 3, is_active: true, is_featured: false, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
    });
    expect(p).toMatchObject({ price: 18500, shortDescription: "s", colourHex: "#9AA88F", stockQuantity: 3 });
  });
});
