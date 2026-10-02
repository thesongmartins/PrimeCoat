/**
 * Upserts the product catalogue into Supabase using the service role.
 *   pnpm db:seed
 * Source of truth: lib/products/seed-data.ts (same data as supabase/seed.sql).
 */
import { createClient } from "@supabase/supabase-js";
import { SEED_PRODUCTS } from "../lib/products/seed-data";
import { loadEnv, need } from "./env";

loadEnv();
const supabase = createClient(need("NEXT_PUBLIC_SUPABASE_URL"), need("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false },
});

const rows = SEED_PRODUCTS.map((p) => ({
  id: p.id,
  name: p.name,
  slug: p.slug,
  description: p.description,
  short_description: p.shortDescription,
  category: p.category,
  price: p.price,
  image_url: p.imageUrl,
  size: p.size,
  colour_name: p.colourName,
  colour_hex: p.colourHex,
  finish: p.finish,
  coverage: p.coverage,
  stock_quantity: p.stockQuantity,
  is_active: p.isActive,
  is_featured: p.isFeatured,
}));

const { error, count } = await supabase.from("products").upsert(rows, { onConflict: "slug", count: "exact" });
if (error) {
  console.error("Seed failed:", error.message);
  process.exit(1);
}
console.log(`Seeded ${count ?? rows.length} products.`);
