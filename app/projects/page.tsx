import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { ButtonLink } from "@/components/ui/button";
import { ProjectsGallery } from "@/components/marketing/projects-gallery";
import { PROJECT_CATEGORY_LABELS, PROJECTS, type ProjectCategory } from "@/lib/content/projects";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = {
  title: "Projects & inspiration",
  description: "A gallery of living rooms, bedrooms, offices, exteriors and commercial spaces finished with PrimeCoat paints.",
};

const CATEGORIES = Object.keys(PROJECT_CATEGORY_LABELS) as ProjectCategory[];

export default async function ProjectsPage(props: PageProps<"/projects">) {
  const sp = await props.searchParams;
  const raw = typeof sp.category === "string" ? sp.category : undefined;
  const active = raw && (CATEGORIES as string[]).includes(raw) ? (raw as ProjectCategory) : undefined;
  const projects = active ? PROJECTS.filter((p) => p.category === active) : PROJECTS;

  return (
    <>
      <section className="border-b border-stone bg-cream py-14 sm:py-20">
        <Container>
          <SectionHeading
            as="h1"
            eyebrow="Projects"
            title="Colour, applied with care"
            description="A selection of recent homes, offices and exteriors painted by PrimeCoat crews. Every space uses products you can buy in our shop."
          />
          <nav aria-label="Project categories" className="mt-8 -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <ul className="flex gap-2">
              <li>
                <Link href="/projects" aria-current={!active ? "page" : undefined} className={cn("inline-flex h-9 items-center rounded-full border px-4 text-sm whitespace-nowrap", !active ? "border-charcoal bg-charcoal text-warm-white" : "border-stone-400/70 bg-white hover:border-charcoal")}>
                  All
                </Link>
              </li>
              {CATEGORIES.map((c) => (
                <li key={c}>
                  <Link href={`/projects?category=${c}`} aria-current={active === c ? "page" : undefined} className={cn("inline-flex h-9 items-center rounded-full border px-4 text-sm whitespace-nowrap", active === c ? "border-charcoal bg-charcoal text-warm-white" : "border-stone-400/70 bg-white hover:border-charcoal")}>
                    {PROJECT_CATEGORY_LABELS[c]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </Container>
      </section>

      <section className="py-12 sm:py-16">
        <Container>
          <ProjectsGallery projects={projects} />
          <div className="mt-16 flex flex-col items-center gap-4 rounded-lg bg-charcoal px-6 py-12 text-center text-warm-white">
            <h2 className="font-display text-3xl font-medium">Like what you see?</h2>
            <p className="max-w-md text-[0.9375rem] text-stone-400">Book a site visit and we will recreate any of these palettes in your space, or help you design your own.</p>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/services#request" variant="inverse" size="lg">Book a Service</ButtonLink>
              <ButtonLink href="/shop?category=interior" variant="outline" size="lg" className="border-warm-white text-warm-white hover:bg-warm-white hover:text-charcoal">Shop the colours</ButtonLink>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
