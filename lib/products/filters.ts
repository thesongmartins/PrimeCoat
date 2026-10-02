import type { ProductCategory } from "@/types/product";
import { isProductCategory } from "@/types/product";

/** Pure filter/sort definitions shared by server queries and client controls. */

export const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "name", label: "Name A–Z" },
  { value: "newest", label: "Newest" },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]["value"];

export function isSortOption(value: string): value is SortOption {
  return SORT_OPTIONS.some((o) => o.value === value);
}

export interface ProductFilters {
  query?: string;
  category?: ProductCategory;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  sort?: SortOption;
}

export function parseProductFilters(params: Record<string, string | string[] | undefined>): ProductFilters {
  const one = (k: string) => {
    const v = params[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const num = (k: string) => {
    const v = Number(one(k));
    return Number.isFinite(v) && v >= 0 ? v : undefined;
  };
  const category = one("category");
  const sort = one("sort");
  return {
    query: one("q")?.trim().slice(0, 100) || undefined,
    category: category && isProductCategory(category) ? category : undefined,
    minPrice: num("min"),
    maxPrice: num("max"),
    inStockOnly: one("inStock") === "1",
    sort: sort && isSortOption(sort) ? sort : "featured",
  };
}
