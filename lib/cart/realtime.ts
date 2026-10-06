/**
 * Decides whether a cart_items Realtime event concerns this user's cart. Same rule as the mobile
 * app (lib/cart-realtime.ts there):
 * - INSERT/UPDATE arrive pre-filtered by `user_id=eq.<uid>` and RLS; we still check the row.
 * - DELETE can't be filtered and arrives for every user carrying only `{ id }`, so it counts only
 *   when the id is one of our own lines.
 */
export function isOwnCartChange(
  event: { eventType: string; new?: Record<string, unknown> | null; old?: Record<string, unknown> | null },
  userId: string,
  ownLineIds: ReadonlySet<string>,
): boolean {
  if (event.eventType === "INSERT" || event.eventType === "UPDATE") return event.new?.user_id === userId;
  if (event.eventType === "DELETE") {
    const id = event.old?.id;
    if (typeof id !== "string") return false;
    if (event.old?.user_id !== undefined) return event.old.user_id === userId;
    return ownLineIds.has(id);
  }
  return false;
}
