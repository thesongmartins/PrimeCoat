"use client";

import { useEffect } from "react";
import { useCartStore } from "@/lib/cart/store";

/** Rehydrates the persisted cart on the client after first paint, avoiding SSR mismatches. */
export function CartHydration() {
  useEffect(() => {
    void useCartStore.persist.rehydrate();
  }, []);
  return null;
}
