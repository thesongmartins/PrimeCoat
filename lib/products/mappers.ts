import { z } from "zod";
import { PRODUCT_CATEGORIES, type Product } from "@/types/product";

/** Runtime-validated shape of a public.products row. */
export const productRowSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  short_description: z.string(),
  category: z.enum(PRODUCT_CATEGORIES),
  price: z.coerce.number(),
  image_url: z.string(),
  size: z.string().nullable(),
  colour_name: z.string().nullable(),
  colour_hex: z.string().nullable(),
  finish: z.string().nullable(),
  coverage: z.string().nullable(),
  stock_quantity: z.number().int(),
  is_active: z.boolean(),
  is_featured: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ProductRow = z.infer<typeof productRowSchema>;

export const PRODUCT_COLUMNS =
  "id, name, slug, description, short_description, category, price, image_url, size, colour_name, colour_hex, finish, coverage, stock_quantity, is_active, is_featured, created_at, updated_at";

export function mapProduct(row: unknown): Product {
  const r = productRowSchema.parse(row);
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.description,
    shortDescription: r.short_description,
    category: r.category,
    price: r.price,
    imageUrl: r.image_url,
    size: r.size,
    colourName: r.colour_name,
    colourHex: r.colour_hex,
    finish: r.finish,
    coverage: r.coverage,
    stockQuantity: r.stock_quantity,
    isActive: r.is_active,
    isFeatured: r.is_featured,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function mapProducts(rows: unknown[] | null): Product[] {
  return (rows ?? []).map(mapProduct);
}
