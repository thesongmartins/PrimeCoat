"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { NIGERIA_STATES } from "@/lib/utils/nigeria-states";
import { logger } from "@/lib/utils/logger";

export type CartActionResult =
  | { ok: true; quantity?: number }
  | { ok: false; code: "AUTH_REQUIRED" | "OUT_OF_STOCK" | "PRODUCT_UNAVAILABLE" | "INVALID" | "UNKNOWN"; error: string };

const productId = z.uuid();
const quantity = z.number().int().min(0).max(999);

function done(): void {
  // Header badge, cart page and checkout all read the cart on the server.
  revalidatePath("/", "layout");
}

async function requireUser() {
  const user = await getCurrentUser();
  return user;
}

export async function addToCart(id: string, qty = 1): Promise<CartActionResult> {
  if (!productId.safeParse(id).success || !quantity.safeParse(qty).success || qty < 1) {
    return { ok: false, code: "INVALID", error: "Invalid product or quantity." };
  }
  if (!(await requireUser())) return { ok: false, code: "AUTH_REQUIRED", error: "Please sign in to add items to your cart." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("cart_add_item", { p_product_id: id, p_quantity: qty });
  if (error) {
    if (error.message.startsWith("OUT_OF_STOCK")) return { ok: false, code: "OUT_OF_STOCK", error: "This product is out of stock." };
    if (error.message.startsWith("PRODUCT_UNAVAILABLE")) return { ok: false, code: "PRODUCT_UNAVAILABLE", error: "This product is no longer available." };
    if (error.message.startsWith("AUTH_REQUIRED")) return { ok: false, code: "AUTH_REQUIRED", error: "Please sign in to add items to your cart." };
    logger.error("cart.add_failed", { message: error.message });
    return { ok: false, code: "UNKNOWN", error: "We couldn't update your cart. Please try again." };
  }
  done();
  return { ok: true, quantity: typeof data === "number" ? data : undefined };
}

export async function setCartQuantity(id: string, qty: number): Promise<CartActionResult> {
  if (!productId.safeParse(id).success || !quantity.safeParse(qty).success) {
    return { ok: false, code: "INVALID", error: "Invalid quantity." };
  }
  if (!(await requireUser())) return { ok: false, code: "AUTH_REQUIRED", error: "Please sign in." };
  if (qty === 0) return removeFromCart(id);

  const supabase = await createClient();
  const { data: product } = await supabase.from("products").select("stock_quantity").eq("id", id).maybeSingle();
  const capped = Math.max(1, Math.min(qty, product?.stock_quantity ?? qty));
  const { error } = await supabase.from("cart_items").update({ quantity: capped }).eq("product_id", id);
  if (error) {
    logger.error("cart.set_quantity_failed", { message: error.message });
    return { ok: false, code: "UNKNOWN", error: "We couldn't update your cart. Please try again." };
  }
  done();
  return { ok: true, quantity: capped };
}

export async function removeFromCart(id: string): Promise<CartActionResult> {
  if (!productId.safeParse(id).success) return { ok: false, code: "INVALID", error: "Invalid product." };
  if (!(await requireUser())) return { ok: false, code: "AUTH_REQUIRED", error: "Please sign in." };
  const supabase = await createClient();
  const { error } = await supabase.from("cart_items").delete().eq("product_id", id);
  if (error) {
    logger.error("cart.remove_failed", { message: error.message });
    return { ok: false, code: "UNKNOWN", error: "We couldn't update your cart. Please try again." };
  }
  done();
  return { ok: true };
}

export async function setDeliveryState(state: string): Promise<CartActionResult> {
  if (!z.enum(NIGERIA_STATES).safeParse(state).success) return { ok: false, code: "INVALID", error: "Unknown state." };
  const user = await requireUser();
  if (!user) return { ok: false, code: "AUTH_REQUIRED", error: "Please sign in." };
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ delivery_state: state }).eq("id", user.id);
  if (error) {
    logger.error("cart.set_state_failed", { message: error.message });
    return { ok: false, code: "UNKNOWN", error: "We couldn't save your delivery state." };
  }
  done();
  return { ok: true };
}
