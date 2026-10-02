import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Price } from "@/components/ui/price";
import { StockBadge } from "@/components/ui/stock-badge";
import { ColourSwatch } from "@/components/ui/colour-swatch";
import { SectionHeading } from "@/components/ui/section-heading";
import { ProductGrid } from "@/components/shop/product-grid";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { ProductPurchasePanel } from "@/components/shop/product-purchase-panel";
import { getProductBySlug, getProducts, getRelatedProducts } from "@/lib/products/queries";
import { CATEGORY_LABELS } from "@/types/product";

export async function generateStaticParams() {
  const products = await getProducts({});
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  const name = product.colourName ? `${product.name} — ${product.colourName}` : product.name;
  return {
    title: `${name}${product.size ? ` (${product.size})` : ""}`,
    description: product.shortDescription,
    openGraph: { images: [{ url: product.imageUrl, width: 800, height: 800 }] },
  };
}

export default async function ProductPage(props: PageProps<"/products/[slug]">) {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const related = await getRelatedProducts(product, 4);

  const specs: { label: string; value: string }[] = [
    { label: "Category", value: CATEGORY_LABELS[product.category] },
    product.size ? { label: "Size", value: product.size } : null,
    product.colourName ? { label: "Colour", value: product.colourName } : null,
    product.finish ? { label: "Finish", value: product.finish } : null,
    product.coverage ? { label: "Coverage", value: product.coverage } : null,
    { label: "Availability", value: product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : "Out of stock" },
  ].filter((s): s is { label: string; value: string } => s !== null);

  return (
    <>
      <Container className="py-8 sm:py-12">
        <Breadcrumbs
          items={[
            { href: "/shop", label: "Shop" },
            { href: `/shop?category=${product.category}`, label: CATEGORY_LABELS[product.category] },
            { label: product.name },
          ]}
        />

        <div className="mt-6 grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <div className="relative overflow-hidden rounded-lg bg-cream">
              <Image
                src={product.imageUrl}
                alt={`${product.name}${product.colourName ? ` in ${product.colourName}` : ""}${product.size ? `, ${product.size}` : ""}`}
                width={800}
                height={800}
                priority
                sizes="(min-width: 1024px) 55vw, 100vw"
                className="aspect-square w-full object-cover"
              />
            </div>
          </div>

          <div className="pb-24 lg:col-span-5 lg:pb-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-mute">{CATEGORY_LABELS[product.category]}</p>
            <h1 className="mt-2 font-display text-3xl font-medium leading-tight sm:text-4xl">{product.name}</h1>
            {product.colourName && (
              <div className="mt-3">
                <ColourSwatch hex={product.colourHex} name={`${product.colourName}${product.finish ? ` · ${product.finish}` : ""}`} size="lg" />
              </div>
            )}
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Price amount={product.price} className="font-display text-3xl font-medium" />
              {product.size && <span className="text-sm text-mute">per {product.size}</span>}
              <StockBadge stockQuantity={product.stockQuantity} />
            </div>
            <p className="mt-6 text-[0.9375rem] leading-relaxed text-charcoal-600">{product.description}</p>

            <div className="mt-8">
              <ProductPurchasePanel product={product} />
            </div>

            <section className="mt-10 border-t border-stone pt-8" aria-labelledby="product-info">
              <h2 id="product-info" className="text-xs font-semibold uppercase tracking-[0.16em] text-mute">
                Product information
              </h2>
              <dl className="mt-4 divide-y divide-stone">
                {specs.map((s) => (
                  <div key={s.label} className="grid grid-cols-3 gap-4 py-3 text-sm">
                    <dt className="text-mute">{s.label}</dt>
                    <dd className="col-span-2 font-medium">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>
        </div>
      </Container>

      {related.length > 0 && (
        <section className="border-t border-stone bg-white py-16 sm:py-20">
          <Container>
            <SectionHeading eyebrow="You may also need" title="Related products" />
            <ProductGrid products={related} className="mt-10" />
          </Container>
        </section>
      )}
    </>
  );
}
