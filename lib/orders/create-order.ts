import "server-only";
import type { Order } from "@/types/order";
import type { CreateOrderInput } from "@/lib/validations/checkout";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import { mapCreateOrderResult } from "./mappers";

export class CreateOrderError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
  ) {
    super(message);
  }
}

/**
 * Calls the create_order() Postgres function as the signed-in user.
 * The database prices every line, computes the delivery fee and total, generates
 * the order number and inserts order + items in one transaction.
 */
export async function createOrderForCurrentUser(input: CreateOrderInput): Promise<Order> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_order", {
    p_customer: input.customer,
    p_items: input.items,
  });

  if (error) {
    const msg = error.message ?? "";
    if (msg.startsWith("AUTH_REQUIRED") || error.code === "42501") {
      throw new CreateOrderError("Please sign in to place an order.", 401, "AUTH_REQUIRED");
    }
    if (msg.startsWith("CART_EMPTY")) throw new CreateOrderError("Your cart is empty.", 400, "CART_EMPTY");
    if (msg.startsWith("PRODUCT_UNAVAILABLE")) {
      throw new CreateOrderError("One of the products in your cart is no longer available. Please review your cart.", 409, "PRODUCT_UNAVAILABLE");
    }
    if (msg.startsWith("INSUFFICIENT_STOCK")) {
      const [, name, available] = msg.split(":");
      throw new CreateOrderError(
        `Only ${available?.trim() ?? "a limited number"} of ${name?.trim() ?? "an item"} ${available === "1" ? "is" : "are"} in stock. Please reduce the quantity.`,
        409,
        "INSUFFICIENT_STOCK",
      );
    }
    if (msg.startsWith("INVALID_QUANTITY") || msg.startsWith("TOO_MANY_ITEMS") || msg.startsWith("CUSTOMER_INCOMPLETE")) {
      throw new CreateOrderError("Some order details are invalid. Please check the form and try again.", 400, "INVALID_INPUT");
    }
    logger.error("orders.create_failed", { code: error.code ?? "unknown", message: msg });
    throw new CreateOrderError("We couldn't place your order right now. Please try again.", 500, "UNKNOWN");
  }

  return mapCreateOrderResult(data);
}
