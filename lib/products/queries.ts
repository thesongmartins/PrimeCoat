import "server-only";
import type { Product } from "@/types/product";
import { createPublicClient } from "@/lib/supabase/public";
import { logger } from "@/lib/utils/logger";
import { mapProduct, mapProducts, PRODUCT_COLUMNS } from "./mappers";
import type { ProductFilters } from "./filters";

export { SORT_OPTIONS, isSortOption, parseProductFilters } from "./filters";
export type { ProductFilters, SortOption } from "./filters";

/**
 * Product data access backed by Supabase (anon role, RLS: active products only).
 * Signatures are unchanged from the Phase 2 static implementation.
 */

function escapeLike(value: string) {
  return value.replace(/[%_\\]/g, (m) => `\\${m}`).replace(/[,()]/g, " ");
}

export async function getProducts(filters: ProductFilters = {}): Promise<Product[]> {
  const supabase = createPublicClient();
  let q = supabase.from("products").select(PRODUCT_COLUMNS).eq("is_active", true);

  if (filters.query) {
    const term = `%${escapeLike(filters.query)}%`;
    q = q.or(`name.ilike.${term},short_description.ilike.${term},colour_name.ilike.${term}`);
  }
  if (filters.category) q = q.eq("category", filters.category);
  if (filters.minPrice !== undefined) q = q.gte("price", filters.minPrice);
  if (filters.maxPrice !== undefined) q = q.lte("price", filters.maxPrice);
  if (filters.inStockOnly) q = q.gt("stock_quantity", 0);

  switch (filters.sort) {
    case "price_asc":
      q = q.order("price", { ascending: true }).order("name");
      break;
    case "price_desc":
      q = q.order("price", { ascending: false }).order("name");
      break;
    case "name":
      q = q.order("name", { ascending: true });
      break;
    case "newest":
      q = q.order("created_at", { ascending: false });
      break;
    default:
      q = q.order("is_featured", { ascending: false }).order("category").order("name");
  }

  const { data, error } = await q;
  if (error) {
    logger.error("products.list_failed", { message: error.message });
    throw new Error("Could not load products");
  }
  return mapProducts(data);
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("is_active", true)
    .eq("is_featured", true)
    .order("category")
    .order("name")
    .limit(limit);
  if (error) {
    logger.error("products.featured_failed", { message: error.message });
    throw new Error("Could not load featured products");
  }
  return mapProducts(data);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("products").select(PRODUCT_COLUMNS).eq("slug", slug).eq("is_active", true).maybeSingle();
  if (error) {
    logger.error("products.by_slug_failed", { slug, message: error.message });
    throw new Error("Could not load product");
  }
  return data ? mapProduct(data) : null;
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return [];
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("products").select(PRODUCT_COLUMNS).in("id", ids);
  if (error) {
    logger.error("products.by_ids_failed", { message: error.message });
    throw new Error("Could not load products");
  }
  return mapProducts(data);
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const supabase = createPublicClient();
  const { data: same, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("is_active", true)
    .eq("category", product.category)
    .neq("id", product.id)
    .order("is_featured", { ascending: false })
    .limit(limit);
  if (error) {
    logger.error("products.related_failed", { message: error.message });
    return [];
  }
  const related = mapProducts(same);
  if (related.length >= limit) return related;

  const { data: others } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("is_active", true)
    .eq("is_featured", true)
    .neq("category", product.category)
    .neq("id", product.id)
    .limit(limit - related.length);
  return [...related, ...mapProducts(others)];
}

export async function getPriceBounds(): Promise<{ min: number; max: number }> {
  const supabase = createPublicClient();
  const [{ data: lo }, { data: hi }] = await Promise.all([
    supabase.from("products").select("price").eq("is_active", true).order("price", { ascending: true }).limit(1).maybeSingle(),
    supabase.from("products").select("price").eq("is_active", true).order("price", { ascending: false }).limit(1).maybeSingle(),
  ]);
  return { min: Number(lo?.price ?? 0), max: Number(hi?.price ?? 0) };
}

export async function getCategoryCounts(): Promise<Record<string, number>> {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("products").select("category").eq("is_active", true);
  if (error) return {};
  return (data ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.category] = (acc[r.category] ?? 0) + 1;
    return acc;
  }, {});
}
