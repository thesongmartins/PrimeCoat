"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CartItem } from "@/types/cart";
import type { Product } from "@/types/product";
import {
  addToItems,
  DEFAULT_DELIVERY_STATE,
  removeFromItems,
  setItemQuantity,
} from "./calculations";

interface CartState {
  items: CartItem[];
  deliveryState: string;
  hasHydrated: boolean;
  addItem: (product: Product, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  setDeliveryState: (state: string) => void;
  setHasHydrated: (value: boolean) => void;
}

export const CART_STORAGE_KEY = "primecoat.cart.v1";

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      deliveryState: DEFAULT_DELIVERY_STATE,
      hasHydrated: false,
      addItem: (product, quantity = 1) =>
        set((s) => ({ items: addToItems(s.items, product, quantity) })),
      setQuantity: (productId, quantity) =>
        set((s) => ({ items: setItemQuantity(s.items, productId, quantity) })),
      removeItem: (productId) => set((s) => ({ items: removeFromItems(s.items, productId) })),
      clear: () => set({ items: [] }),
      setDeliveryState: (deliveryState) => set({ deliveryState }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: CART_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items, deliveryState: s.deliveryState }),
      skipHydration: true,
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    },
  ),
);
