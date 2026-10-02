export const PRODUCT_CATEGORIES = [
  "interior",
  "exterior",
  "ceiling",
  "primer",
  "gloss",
  "textured",
  "wood_finish",
  "metal_finish",
  "accessories",
  "tools",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  interior: "Interior",
  exterior: "Exterior",
  ceiling: "Ceiling",
  primer: "Primer",
  gloss: "Gloss",
  textured: "Textured",
  wood_finish: "Wood Finish",
  metal_finish: "Metal Finish",
  accessories: "Accessories",
  tools: "Tools",
};

export function isProductCategory(value: string): value is ProductCategory {
  return (PRODUCT_CATEGORIES as readonly string[]).includes(value);
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  category: ProductCategory;
  /** Price in NGN. */
  price: number;
  imageUrl: string;
  /** Pack size / volume, e.g. "4 L", "20 L", "230 mm". Null for items without a size. */
  size: string | null;
  colourName: string | null;
  colourHex: string | null;
  /** Finish or sheen, e.g. "Matt", "Silk", "High gloss". */
  finish: string | null;
  /** Approximate coverage per litre, e.g. "10–12 m² per litre per coat". */
  coverage: string | null;
  stockQuantity: number;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export function getStockStatus(stockQuantity: number): StockStatus {
  if (stockQuantity <= 0) return "out_of_stock";
  if (stockQuantity <= 5) return "low_stock";
  return "in_stock";
}

export const STOCK_LABELS: Record<StockStatus, string> = {
  in_stock: "In stock",
  low_stock: "Low stock",
  out_of_stock: "Out of stock",
};
