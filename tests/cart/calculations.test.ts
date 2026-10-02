import { describe, expect, it } from "vitest";
import {
  addToItems,
  calculateDeliveryFee,
  cartItemCount,
  cartSubtotal,
  cartTotals,
  clampQuantity,
  FREE_DELIVERY_THRESHOLD,
  lineSubtotal,
  removeFromItems,
  setItemQuantity,
  toCartItem,
} from "@/lib/cart/calculations";
import { SEED_PRODUCTS } from "@/lib/products/seed-data";

const sage = SEED_PRODUCTS.find((p) => p.slug === "velvet-matt-sage-grove-4l")!; // 18500, stock 31
const roller = SEED_PRODUCTS.find((p) => p.slug === "microfibre-roller-sleeve-230mm-2pk")!; // 5600
const brushes = SEED_PRODUCTS.find((p) => p.slug === "professional-brush-set-3pc")!; // stock 3
const outOfStock = SEED_PRODUCTS.find((p) => p.slug === "satin-enamel-jet-black-1l")!; // stock 0

describe("calculateDeliveryFee (must mirror SQL calculate_delivery_fee)", () => {
  it.each([
    [0, "Lagos", 0],
    [-5, "Lagos", 0],
    [42600, "Lagos", 2500],
    [5000, "Ogun", 4000],
    [5000, "Oyo", 4000],
    [5000, "Osun", 4000],
    [5000, "Ondo", 4000],
    [5000, "Ekiti", 4000],
    [5000, "FCT Abuja", 5000],
    [5000, "Kano", 7500],
    [5000, "Rivers", 7500],
    [5000, null, 7500],
    [FREE_DELIVERY_THRESHOLD, "Kano", 0],
    [FREE_DELIVERY_THRESHOLD - 1, "Kano", 7500],
    [160000, "Lagos", 0],
  ])("subtotal %d in %s → %d", (subtotal, state, expected) => {
    expect(calculateDeliveryFee(subtotal, state)).toBe(expected);
  });
});

describe("quantity handling", () => {
  it("clamps to [1, stock]", () => {
    expect(clampQuantity(0, 10)).toBe(1);
    expect(clampQuantity(5, 10)).toBe(5);
    expect(clampQuantity(50, 10)).toBe(10);
    expect(clampQuantity(2.7, 10)).toBe(2);
    expect(clampQuantity(Number.NaN, 10)).toBe(1);
  });

  it("adds a new product and merges repeat adds", () => {
    let items = addToItems([], sage, 2);
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(2);
    items = addToItems(items, sage, 3);
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(5);
    items = addToItems(items, roller);
    expect(items).toHaveLength(2);
  });

  it("never exceeds stock when adding", () => {
    const items = addToItems(addToItems([], brushes, 2), brushes, 5);
    expect(items[0].quantity).toBe(3);
  });

  it("ignores out-of-stock products", () => {
    expect(addToItems([], outOfStock, 1)).toHaveLength(0);
  });

  it("setItemQuantity updates, clamps and removes at zero", () => {
    let items = addToItems([], sage, 1);
    items = setItemQuantity(items, sage.id, 4);
    expect(items[0].quantity).toBe(4);
    items = setItemQuantity(items, sage.id, 999);
    expect(items[0].quantity).toBe(sage.stockQuantity);
    items = setItemQuantity(items, sage.id, 0);
    expect(items).toHaveLength(0);
  });

  it("removeFromItems removes only the target", () => {
    const items = addToItems(addToItems([], sage), roller);
    const after = removeFromItems(items, sage.id);
    expect(after.map((i) => i.productId)).toEqual([roller.id]);
  });

  it("toCartItem snapshots display fields", () => {
    const item = toCartItem(sage, 2);
    expect(item).toMatchObject({ productId: sage.id, name: sage.name, price: 18500, colourName: "Sage Grove", quantity: 2 });
  });
});

describe("totals", () => {
  const items = addToItems(addToItems([], sage, 2), roller, 1);

  it("line and cart subtotals", () => {
    expect(lineSubtotal(items[0])).toBe(37000);
    expect(cartSubtotal(items)).toBe(42600);
    expect(cartItemCount(items)).toBe(3);
  });

  it("cartTotals combines subtotal, fee and total", () => {
    expect(cartTotals(items, "Lagos")).toEqual({ subtotal: 42600, deliveryFee: 2500, total: 45100, itemCount: 3 });
    expect(cartTotals(items, "Kano")).toEqual({ subtotal: 42600, deliveryFee: 7500, total: 50100, itemCount: 3 });
  });

  it("empty cart has zero everything", () => {
    expect(cartTotals([], "Lagos")).toEqual({ subtotal: 0, deliveryFee: 0, total: 0, itemCount: 0 });
  });

  it("avoids floating point drift", () => {
    const odd = [{ ...toCartItem(sage, 3), price: 0.1 }, { ...toCartItem(roller, 1), price: 0.2 }];
    expect(cartSubtotal(odd)).toBe(0.5);
  });
});
