import Link from "next/link";
import { SlidersHorizontal, X } from "lucide-react";
import type { ProductFilters } from "@/lib/products/queries";
import { CATEGORY_LABELS, PRODUCT_CATEGORIES } from "@/types/product";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface Props {
  filters: ProductFilters;
  counts: Record<string, number>;
  priceBounds: { min: number; max: number };
  className?: string;
}

function buildHref(filters: ProductFilters, overrides: Partial<Record<"category" | "q" | "min" | "max" | "inStock" | "sort", string | undefined>>) {
  const p = new URLSearchParams();
  const vals: Record<string, string | undefined> = {
    q: filters.query,
    category: filters.category,
    min: filters.minPrice?.toString(),
    max: filters.maxPrice?.toString(),
    inStock: filters.inStockOnly ? "1" : undefined,
    sort: filters.sort && filters.sort !== "featured" ? filters.sort : undefined,
    ...overrides,
  };
  for (const [k, v] of Object.entries(vals)) if (v) p.set(k, v);
  const s = p.toString();
  return s ? `/shop?${s}` : "/shop";
}

export function Filters({ filters, counts, priceBounds, className }: Props) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const hasActive = Boolean(filters.category || filters.minPrice !== undefined || filters.maxPrice !== undefined || filters.inStockOnly);

  return (
    <div className={cn("space-y-8", className)}>
      <section aria-labelledby="filter-category">
        <h2 id="filter-category" className="text-xs font-semibold uppercase tracking-[0.16em] text-mute">
          Category
        </h2>
        <ul className="mt-3 space-y-1">
          <li>
            <Link
              href={buildHref(filters, { category: undefined })}
              aria-current={!filters.category ? "true" : undefined}
              className={cn("flex items-center justify-between rounded-md px-2.5 py-1.5 text-sm hover:bg-stone-200", !filters.category && "bg-stone-200 font-medium")}
            >
              All products <span className="text-xs text-mute tabular-nums">{total}</span>
            </Link>
          </li>
          {PRODUCT_CATEGORIES.map((c) => (
            <li key={c}>
              <Link
                href={buildHref(filters, { category: c })}
                aria-current={filters.category === c ? "true" : undefined}
                className={cn("flex items-center justify-between rounded-md px-2.5 py-1.5 text-sm hover:bg-stone-200", filters.category === c && "bg-stone-200 font-medium")}
              >
                {CATEGORY_LABELS[c]} <span className="text-xs text-mute tabular-nums">{counts[c] ?? 0}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <form action="/shop" method="get" className="space-y-6">
        {filters.query && <input type="hidden" name="q" value={filters.query} />}
        {filters.category && <input type="hidden" name="category" value={filters.category} />}
        {filters.sort && filters.sort !== "featured" && <input type="hidden" name="sort" value={filters.sort} />}

        <fieldset>
          <legend className="text-xs font-semibold uppercase tracking-[0.16em] text-mute">Price (₦)</legend>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="min" className="sr-only">Minimum price</Label>
              <Input id="min" name="min" type="number" inputMode="numeric" min={0} step={500} placeholder={`${priceBounds.min}`} defaultValue={filters.minPrice ?? ""} className="h-10 text-sm" />
            </div>
            <div>
              <Label htmlFor="max" className="sr-only">Maximum price</Label>
              <Input id="max" name="max" type="number" inputMode="numeric" min={0} step={500} placeholder={`${priceBounds.max}`} defaultValue={filters.maxPrice ?? ""} className="h-10 text-sm" />
            </div>
          </div>
        </fieldset>

        <div className="flex items-center gap-2.5">
          <input id="inStock" name="inStock" type="checkbox" value="1" defaultChecked={filters.inStockOnly} className="size-4 rounded border-stone-400 accent-charcoal" />
          <Label htmlFor="inStock" className="mb-0 font-normal">In stock only</Label>
        </div>

        <div className="flex items-center gap-2">
          <Button type="submit" size="sm" variant="outline">
            <SlidersHorizontal className="size-3.5" aria-hidden="true" /> Apply
          </Button>
          {hasActive && (
            <Link href={buildHref({ query: filters.query, sort: filters.sort }, {})} className="inline-flex h-9 items-center gap-1 px-2 text-sm text-mute hover:text-charcoal">
              <X className="size-3.5" aria-hidden="true" /> Clear
            </Link>
          )}
        </div>
      </form>
    </div>
  );
}

export function ActiveFilterChips({ filters }: { filters: ProductFilters }) {
  const chips: { label: string; href: string }[] = [];
  if (filters.query) chips.push({ label: `“${filters.query}”`, href: buildHref(filters, { q: undefined }) });
  if (filters.category) chips.push({ label: CATEGORY_LABELS[filters.category], href: buildHref(filters, { category: undefined }) });
  if (filters.minPrice !== undefined) chips.push({ label: `From ₦${filters.minPrice.toLocaleString()}`, href: buildHref(filters, { min: undefined }) });
  if (filters.maxPrice !== undefined) chips.push({ label: `Up to ₦${filters.maxPrice.toLocaleString()}`, href: buildHref(filters, { max: undefined }) });
  if (filters.inStockOnly) chips.push({ label: "In stock", href: buildHref(filters, { inStock: undefined }) });
  if (!chips.length) return null;
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Active filters">
      {chips.map((c) => (
        <li key={c.label}>
          <Link href={c.href} className="inline-flex items-center gap-1.5 rounded-full border border-stone bg-white px-3 py-1 text-xs font-medium hover:border-charcoal" aria-label={`Remove filter ${c.label}`}>
            {c.label} <X className="size-3" aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
