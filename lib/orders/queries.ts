import "server-only";
import type { Order, OrderSummary } from "@/types/order";

/**
 * Order data access for the signed-in user.
 * Phase 2: stubs so the pages render their empty / not-found states.
 * Phase 6: replace with Supabase queries using the server client (RLS scopes rows to auth.uid()).
 */
export async function getOrdersForCurrentUser(): Promise<OrderSummary[]> {
  return [];
}

export async function getOrderById(id: string): Promise<Order | null> {
  void id;
  return null;
}

export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  void orderNumber;
  return null;
}
