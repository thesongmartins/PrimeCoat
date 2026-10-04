import "server-only";
import { cache } from "react";
import { z } from "zod";
import type { CartItem } from "@/types/cart";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { isNigeriaState } from "@/lib/utils/nigeria-states";
import { DEFAULT_DELIVERY_STATE } from "./calculations";
import { logger } from "@/lib/utils/logger";

export interface ServerCart {
  items: CartItem[];
  deliveryState: string;
}

const rowSchema = z.object({
  quantity: z.number().int(),
  product: z
    .object({
      id: z.uuid(),
      slug: z.string(),
      name: z.string(),
      price: z.coerce.number(),
      image_url: z.string(),
      size: z.string().nullable(),
      colour_name: z.string().nullable(),
      colour_hex: z.string().nullable(),
      stock_quantity: z.number().int(),
    })
    .nullable(),
});

const EMPTY: ServerCart = { items: [], deliveryState: DEFAULT_DELIVERY_STATE };

/**
 * The signed-in user's cart, priced from the current product rows. RLS limits rows to the owner.
 * Deduplicated per request so the header badge, cart page and checkout share one query.
 */
export const getCartForCurrentUser = cache(async (): Promise<ServerCart> => {
  const user = await getCurrentUser();
  if (!user) return EMPTY;
  const supabase = await createClient();

  const [cartRes, profileRes] = await Promise.all([
    supabase
      .from("cart_items")
      .select("quantity, product:products(id, slug, name, price, image_url, size, colour_name, colour_hex, stock_quantity)")
      .order("created_at", { ascending: true }),
    supabase.from("profiles").select("delivery_state").eq("id", user.id).maybeSingle(),
  ]);

  if (cartRes.error) {
    logger.error("cart.load_failed", { message: cartRes.error.message });
    throw new Error("Could not load your cart");
  }

  const items: CartItem[] = [];
  for (const raw of cartRes.data ?? []) {
    const row = rowSchema.parse(raw);
    // Products that were deactivated are hidden by RLS and come back null: skip them.
    if (!row.product) continue;
    const p = row.product;
    items.push({
      productId: p.id,
      slug: p.slug,
      name: p.name,
      price: p.price,
      imageUrl: p.image_url,
      size: p.size,
      colourName: p.colour_name,
      colourHex: p.colour_hex,
      stockQuantity: p.stock_quantity,
      quantity: row.quantity,
    });
  }

  const saved = profileRes.data?.delivery_state;
  return { items, deliveryState: saved && isNigeriaState(saved) ? saved : DEFAULT_DELIVERY_STATE };
});

export async function getCartCount(): Promise<number> {
  const { items } = await getCartForCurrentUser();
  return items.reduce((n, i) => n + i.quantity, 0);
}
