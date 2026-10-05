import "server-only";
import type { Order, OrderSummary } from "@/types/order";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { logger } from "@/lib/utils/logger";
import { mapOrder, mapOrderSummary, ORDER_COLUMNS, ORDER_ITEM_COLUMNS } from "./mappers";

/**
 * Order reads for the signed-in user. Every query runs through the cookie-based
 * server client, so RLS restricts rows to auth.uid(). No manual user_id filter is
 * needed — and none is used, so RLS is the single enforcement point.
 */

export async function getOrdersForCurrentUser(): Promise<OrderSummary[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number, total, status, payment_method, payment_status, created_at, order_items(quantity)")
    .order("created_at", { ascending: false });
  if (error) {
    logger.error("orders.list_failed", { message: error.message });
    throw new Error("Could not load your orders");
  }
  return (data ?? []).map(mapOrderSummary);
}

export async function getOrderById(id: string): Promise<Order | null> {
  if (!isSupabaseConfigured()) return null;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(`${ORDER_COLUMNS}, order_items(${ORDER_ITEM_COLUMNS})`)
    .eq("id", id)
    .maybeSingle();
  if (error) {
    logger.error("orders.by_id_failed", { message: error.message });
    throw new Error("Could not load that order");
  }
  return data ? mapOrder(data) : null;
}

export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(`${ORDER_COLUMNS}, order_items(${ORDER_ITEM_COLUMNS})`)
    .eq("order_number", orderNumber)
    .maybeSingle();
  if (error) {
    logger.error("orders.by_number_failed", { message: error.message });
    throw new Error("Could not load that order");
  }
  return data ? mapOrder(data) : null;
}
