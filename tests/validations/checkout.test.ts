import { describe, expect, it } from "vitest";
import { cartItemsSchema, checkoutSchema, createOrderSchema, normalisePhone } from "@/lib/validations/checkout";

const valid = {
  fullName: "Ada Okonkwo",
  email: "ada@example.com",
  phone: "0803 123 4567",
  deliveryAddress: "14 Bourdillon Road, Ikoyi",
  city: "Lagos",
  state: "Lagos",
  deliveryInstructions: "",
};

describe("checkoutSchema", () => {
  it("accepts a complete form", () => {
    expect(checkoutSchema.safeParse(valid).success).toBe(true);
  });

  it.each([
    ["fullName", "A"],
    ["email", "not-an-email"],
    ["phone", "12345"],
    ["phone", "+1 555 123 4567"],
    ["deliveryAddress", "x"],
    ["city", ""],
    ["state", "Atlantis"],
  ])("rejects bad %s = %j", (field, value) => {
    const result = checkoutSchema.safeParse({ ...valid, [field]: value });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].path).toEqual([field]);
  });

  it.each(["08031234567", "0803 123 4567", "+2348031234567", "+234 803-123-4567", "09012345678", "07011122233"])("accepts Nigerian phone %s", (phone) => {
    expect(checkoutSchema.safeParse({ ...valid, phone }).success).toBe(true);
  });

  it("limits delivery instructions to 500 chars", () => {
    expect(checkoutSchema.safeParse({ ...valid, deliveryInstructions: "x".repeat(501) }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...valid, deliveryInstructions: "x".repeat(500) }).success).toBe(true);
  });

  it("trims whitespace", () => {
    const r = checkoutSchema.parse({ ...valid, fullName: "  Ada  ", city: " Lagos " });
    expect(r.fullName).toBe("Ada");
    expect(r.city).toBe("Lagos");
  });
});

describe("normalisePhone", () => {
  it("strips spaces, dashes and brackets", () => {
    expect(normalisePhone("(0803) 123-4567")).toBe("08031234567");
  });
});

describe("cartItemsSchema", () => {
  const id = "a1000000-0000-4000-8000-000000000001";
  it("requires at least one valid line", () => {
    expect(cartItemsSchema.safeParse([]).success).toBe(false);
    expect(cartItemsSchema.safeParse([{ productId: id, quantity: 1 }]).success).toBe(true);
  });
  it("rejects non-uuid ids, zero/fractional/huge quantities", () => {
    expect(cartItemsSchema.safeParse([{ productId: "nope", quantity: 1 }]).success).toBe(false);
    expect(cartItemsSchema.safeParse([{ productId: id, quantity: 0 }]).success).toBe(false);
    expect(cartItemsSchema.safeParse([{ productId: id, quantity: 1.5 }]).success).toBe(false);
    expect(cartItemsSchema.safeParse([{ productId: id, quantity: 1000 }]).success).toBe(false);
  });
  it("caps line count at 50", () => {
    const many = Array.from({ length: 51 }, () => ({ productId: id, quantity: 1 }));
    expect(cartItemsSchema.safeParse(many).success).toBe(false);
  });
  it("does not carry client-supplied prices through", () => {
    const r = cartItemsSchema.parse([{ productId: id, quantity: 1, price: 1 } as unknown as { productId: string; quantity: number }]);
    expect(r[0]).toEqual({ productId: id, quantity: 1 });
  });
});

describe("createOrderSchema", () => {
  it("combines customer and items", () => {
    const r = createOrderSchema.safeParse({ customer: valid, items: [{ productId: "a1000000-0000-4000-8000-000000000001", quantity: 2 }] });
    expect(r.success).toBe(true);
  });
});
