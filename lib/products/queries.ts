import type { Product, ProductCategory } from "@/types/product";
import { isProductCategory } from "@/types/product";
import { SEED_PRODUCTS } from "./seed-data";

/**
 * Product data access.
 * Phase 2: backed by the static catalogue.
 * Phase 4: swap the internals for Supabase queries — keep the signatures.
 */

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

export function parseProductFilters(
  params: Record<string, string | string[] | undefined>,
): ProductFilters {
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
    query: one("q")?.trim() || undefined,
    category: category && isProductCategory(category) ? category : undefined,
    minPrice: num("min"),
    maxPrice: num("max"),
    inStockOnly: one("inStock") === "1",
    sort: sort && isSortOption(sort) ? sort : "featured",
  };
}

function applyFilters(products: Product[], filters: ProductFilters): Product[] {
  let result = products.filter((p) => p.isActive);
  if (filters.query) {
    const q = filters.query.toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.shortDescription.toLowerCase().includes(q) ||
        (p.colourName?.toLowerCase().includes(q) ?? false),
    );
  }
  if (filters.category) result = result.filter((p) => p.category === filters.category);
  if (filters.minPrice !== undefined) result = result.filter((p) => p.price >= filters.minPrice!);
  if (filters.maxPrice !== undefined) result = result.filter((p) => p.price <= filters.maxPrice!);
  if (filters.inStockOnly) result = result.filter((p) => p.stockQuantity > 0);

  switch (filters.sort) {
    case "price_asc":
      result.sort((a, b) => a.price - b.price);
      break;
    case "price_desc":
      result.sort((a, b) => b.price - a.price);
      break;
    case "name":
      result.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "newest":
      result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      break;
    default:
      result.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));
  }
  return result;
}

export async function getProducts(filters: ProductFilters = {}): Promise<Product[]> {
  return applyFilters(SEED_PRODUCTS, filters);
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  return SEED_PRODUCTS.filter((p) => p.isActive && p.isFeatured).slice(0, limit);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return SEED_PRODUCTS.find((p) => p.slug === slug && p.isActive) ?? null;
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  const set = new Set(ids);
  return SEED_PRODUCTS.filter((p) => set.has(p.id));
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const sameCategory = SEED_PRODUCTS.filter(
    (p) => p.isActive && p.id !== product.id && p.category === product.category,
  );
  const others = SEED_PRODUCTS.filter(
    (p) => p.isActive && p.id !== product.id && p.category !== product.category && p.isFeatured,
  );
  return [...sameCategory, ...others].slice(0, limit);
}

export async function getPriceBounds(): Promise<{ min: number; max: number }> {
  const prices = SEED_PRODUCTS.filter((p) => p.isActive).map((p) => p.price);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}
