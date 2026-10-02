import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { ProductGrid } from "@/components/shop/product-grid";
import { Filters, ActiveFilterChips } from "@/components/shop/filters";
import { SortSelect } from "@/components/shop/sort-select";
import { getCategoryCounts, getPriceBounds, getProducts, parseProductFilters } from "@/lib/products/queries";
import { CATEGORY_LABELS } from "@/types/product";

export const metadata: Metadata = {
  title: "Shop paints, primers, gloss and tools",
  description: "Browse PrimeCoat interior and exterior emulsions, primers, enamels, textured finishes and professional painting tools. Pay on Delivery nationwide.",
};

export default async function ShopPage(props: PageProps<"/shop">) {
  const searchParams = await props.searchParams;
  const filters = parseProductFilters(searchParams);
  const [products, counts, priceBounds] = await Promise.all([
    getProducts(filters),
    getCategoryCounts(),
    getPriceBounds(),
  ]);

  const title = filters.category ? CATEGORY_LABELS[filters.category] : filters.query ? `Results for “${filters.query}”` : "All products";

  return (
    <Container className="py-10 sm:py-14">
      <SectionHeading
        as="h1"
        eyebrow="Shop"
        title={title}
        description={filters.category ? undefined : "Premium emulsions, enamels, primers and the tools to apply them. Delivered to your door, paid on delivery."}
      />

      <div className="mt-10 grid gap-10 lg:grid-cols-12">
        <aside className="lg:col-span-3">
          <details className="group rounded-lg border border-stone bg-white lg:hidden" open={false}>
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
              Filters
              <span className="text-xs text-mute group-open:hidden">Show</span>
              <span className="hidden text-xs text-mute group-open:inline">Hide</span>
            </summary>
            <div className="border-t border-stone p-4">
              <Filters filters={filters} counts={counts} priceBounds={priceBounds} />
            </div>
          </details>
          <div className="hidden lg:block">
            <Filters filters={filters} counts={counts} priceBounds={priceBounds} />
          </div>
        </aside>

        <div className="lg:col-span-9">
          <div className="flex flex-col gap-4 border-b border-stone pb-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-mute" aria-live="polite">
              {products.length} {products.length === 1 ? "product" : "products"}
            </p>
            <Suspense>
              <SortSelect value={filters.sort ?? "featured"} />
            </Suspense>
          </div>
          <div className="mt-4">
            <ActiveFilterChips filters={filters} />
          </div>

          {products.length ? (
            <ProductGrid products={products} className="mt-8 xl:grid-cols-3" priorityCount={4} />
          ) : (
            <EmptyState
              className="mt-8"
              title="No products match those filters"
              description="Try a different category, widen the price range or clear your search."
              action={
                <ButtonLink href="/shop" variant="outline">
                  Clear filters
                </ButtonLink>
              }
            />
          )}
        </div>
      </div>
    </Container>
  );
}
