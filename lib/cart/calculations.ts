import type { CartItem, CartTotals } from "@/types/cart";
import type { Product } from "@/types/product";
import { roundMoney } from "@/lib/utils/format-currency";

/**
 * Pure cart functions. No React, no storage — fully unit-tested.
 *
 * The delivery-fee rule is mirrored in SQL (`calculate_delivery_fee`).
 * The SQL version is the source of truth for stored orders; this copy
 * produces estimates in the cart. Change both together. See AGENTS.md §6.
 */

export const FREE_DELIVERY_THRESHOLD = 150_000;
export const DEFAULT_DELIVERY_STATE = "Lagos";

const SOUTH_WEST = new Set(["Ogun", "Oyo", "Osun", "Ondo", "Ekiti"]);

export function calculateDeliveryFee(subtotal: number, state: string | null | undefined): number {
  if (subtotal <= 0) return 0;
  if (subtotal >= FREE_DELIVERY_THRESHOLD) return 0;
  if (!state) return 7500;
  if (state === "Lagos") return 2500;
  if (SOUTH_WEST.has(state)) return 4000;
  if (state === "FCT Abuja") return 5000;
  return 7500;
}

export function lineSubtotal(item: Pick<CartItem, "price" | "quantity">): number {
  return roundMoney(item.price * item.quantity);
}

export function cartSubtotal(items: ReadonlyArray<CartItem>): number {
  return roundMoney(items.reduce((sum, item) => sum + lineSubtotal(item), 0));
}

export function cartItemCount(items: ReadonlyArray<CartItem>): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function cartTotals(items: ReadonlyArray<CartItem>, state: string | null | undefined): CartTotals {
  const subtotal = cartSubtotal(items);
  const deliveryFee = calculateDeliveryFee(subtotal, state);
  return {
    subtotal,
    deliveryFee,
    total: roundMoney(subtotal + deliveryFee),
    itemCount: cartItemCount(items),
  };
}

export function clampQuantity(quantity: number, stockQuantity: number): number {
  const max = Math.max(0, Math.floor(stockQuantity));
  const q = Math.floor(Number.isFinite(quantity) ? quantity : 1);
  return Math.min(Math.max(q, 1), Math.max(max, 1));
}

export function toCartItem(product: Product, quantity: number): CartItem {
  return {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    imageUrl: product.imageUrl,
    size: product.size,
    colourName: product.colourName,
    colourHex: product.colourHex,
    stockQuantity: product.stockQuantity,
    quantity: clampQuantity(quantity, product.stockQuantity),
  };
}

export function addToItems(items: ReadonlyArray<CartItem>, product: Product, quantity = 1): CartItem[] {
  if (product.stockQuantity <= 0) return [...items];
  const existing = items.find((i) => i.productId === product.id);
  if (!existing) return [...items, toCartItem(product, quantity)];
  return items.map((i) =>
    i.productId === product.id
      ? {
          ...i,
          price: product.price,
          stockQuantity: product.stockQuantity,
          quantity: clampQuantity(i.quantity + quantity, product.stockQuantity),
        }
      : i,
  );
}

export function setItemQuantity(
  items: ReadonlyArray<CartItem>,
  productId: string,
  quantity: number,
): CartItem[] {
  if (quantity <= 0) return items.filter((i) => i.productId !== productId);
  return items.map((i) =>
    i.productId === productId ? { ...i, quantity: clampQuantity(quantity, i.stockQuantity) } : i,
  );
}

export function removeFromItems(items: ReadonlyArray<CartItem>, productId: string): CartItem[] {
  return items.filter((i) => i.productId !== productId);
}
