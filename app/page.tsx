import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { ButtonLink } from "@/components/ui/button";
import { Hero } from "@/components/marketing/hero";
import { WhyPrimeCoat } from "@/components/marketing/why-primecoat";
import { ServicesTeaser } from "@/components/marketing/services-teaser";
import { ProjectsGallery } from "@/components/marketing/projects-gallery";
import { ConsultationCta } from "@/components/marketing/consultation-cta";
import { CategoryTiles } from "@/components/shop/category-tiles";
import { ProductGrid } from "@/components/shop/product-grid";
import { getFeaturedProducts } from "@/lib/products/queries";
import { PROJECTS } from "@/lib/content/projects";

export default async function HomePage() {
  const featured = await getFeaturedProducts(8);
  const projects = PROJECTS.filter((p) => ["p1", "p2", "p3", "p4", "p6", "p7"].includes(p.id));

  return (
    <>
      <Hero />

      <section className="py-16 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="Shop by category"
            title="Everything from primer to final coat"
            action={
              <ButtonLink href="/shop" variant="ghost" size="sm">
                View all products →
              </ButtonLink>
            }
          />
          <CategoryTiles className="mt-10" />
        </Container>
      </section>

      <section className="border-y border-stone bg-white py-16 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="Featured products"
            title="Our most-loved paints and tools"
            description="Tested colours, dependable finishes and the kit to apply them properly."
            action={
              <ButtonLink href="/shop" variant="outline" size="sm">
                Shop all
              </ButtonLink>
            }
          />
          <ProductGrid products={featured} className="mt-10" />
        </Container>
      </section>

      <WhyPrimeCoat />
      <ServicesTeaser />

      <section className="border-t border-stone bg-cream py-20 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow="Projects"
            title="Recent work, room by room"
            description="Living rooms, bedrooms, offices and exteriors finished with PrimeCoat paints."
            action={
              <ButtonLink href="/projects" variant="outline" size="sm">
                See all projects
              </ButtonLink>
            }
          />
          <ProjectsGallery projects={projects} className="mt-10" />
        </Container>
      </section>

      <ConsultationCta />
    </>
  );
}
