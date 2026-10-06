"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isOwnCartChange } from "@/lib/cart/realtime";

/**
 * Keeps the server-rendered cart (header badge, /cart, /checkout) in step with changes made
 * elsewhere — the mobile app, another tab, or an order emptying the cart. Realtime is only a
 * signal: on a change the page re-renders from the database via router.refresh().
 * Also refreshes when the tab becomes visible again, since events are lost while it sleeps.
 */
export function CartRealtime({ userId }: { userId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let channel: RealtimeChannel | null = null;
    let ownLineIds = new Set<string>();

    const loadLineIds = async () => {
      const { data } = await supabase.from("cart_items").select("id");
      ownLineIds = new Set((data ?? []).map((r: { id: string }) => r.id));
    };

    // Bursts (an order deleting every line) collapse into one refresh.
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        router.refresh();
        void loadLineIds();
      }, 300);
    };

    const onChange = (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
      const event = { eventType: payload.eventType, new: payload.new as Record<string, unknown>, old: payload.old as Record<string, unknown> };
      if (isOwnCartChange(event, userId, ownLineIds)) refresh();
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);

    void (async () => {
      // Join with the user's JWT, not the anon key, or RLS drops every event.
      const { data } = await supabase.auth.getSession();
      if (cancelled || !data.session) return;
      await supabase.realtime.setAuth(data.session.access_token);
      await loadLineIds();
      if (cancelled) return;
      channel = supabase
        .channel(`cart:${userId}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "cart_items", filter: `user_id=eq.${userId}` }, onChange)
        .on("postgres_changes", { event: "DELETE", schema: "public", table: "cart_items" }, onChange)
        .subscribe((status) => {
          // Reconnected after a drop: catch anything missed meanwhile.
          if (status === "SUBSCRIBED") void loadLineIds();
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") refresh();
        });
    })();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [userId, router]);

  return null;
}
