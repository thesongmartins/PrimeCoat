import type { Metadata } from "next";
import Image from "next/image";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { ButtonLink } from "@/components/ui/button";
import { ServiceCard } from "@/components/services/service-card";
import { ServiceRequestForm } from "@/components/services/service-request-form";
import { SERVICES } from "@/lib/content/services";
import { IMAGES } from "@/lib/content/images";
import { isServiceType } from "@/lib/content/service-type";

export const metadata: Metadata = {
  title: "Professional painting services",
  description: "Residential and commercial painting, colour consultation, surface preparation and repainting by PrimeCoat crews across Nigeria.",
};

const PROCESS = [
  { title: "Site visit & quote", body: "A consultant inspects the surfaces, measures up and sends a written quote with a product schedule." },
  { title: "Colour & samples", body: "We bring large swatches and sample pots so you can see colours in your own light before deciding." },
  { title: "Preparation", body: "Furniture protected, walls washed, cracks filled, surfaces sanded and primed." },
  { title: "Finish & handover", body: "Two full coats, crisp edges, a clean site and a walkthrough with you before we leave." },
];

export default async function ServicesPage(props: PageProps<"/services">) {
  const sp = await props.searchParams;
  const requested = typeof sp.service === "string" && isServiceType(sp.service) ? sp.service : undefined;

  return (
    <>
      <section className="border-b border-stone bg-cream">
        <Container className="grid items-center gap-10 py-14 lg:grid-cols-12 lg:py-20">
          <div className="lg:col-span-6">
            <SectionHeading
              as="h1"
              eyebrow="Painting services"
              title="Professional painters, PrimeCoat finishes"
              description="From a single feature wall to a whole commercial building, our crews prepare properly, apply full two-coat systems and leave your space clean."
            />
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="#request" size="lg">Book a Service</ButtonLink>
              <ButtonLink href="/projects" size="lg" variant="outline">See our work</ButtonLink>
            </div>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg lg:col-span-6">
            <Image src={`${IMAGES.services.src}&w=1400&q=80`} alt={IMAGES.services.alt} fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container>
          <SectionHeading eyebrow="What we do" title="Seven services, one accountable team" />
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {SERVICES.map((s, i) => (
              <ServiceCard key={s.type} service={s} index={i} />
            ))}
          </div>
        </Container>
      </section>

      <section className="border-y border-stone bg-white py-16 sm:py-20">
        <Container>
          <SectionHeading eyebrow="How it works" title="A clear process from first call to final coat" />
          <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS.map((p, i) => (
              <li key={p.title} className="border-t border-charcoal pt-5">
                <span className="font-display text-sm text-terracotta">Step {i + 1}</span>
                <h3 className="mt-2 font-display text-xl font-medium">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mute">{p.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section id="request" className="scroll-mt-20 py-16 sm:py-20">
        <Container className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionHeading
              eyebrow="Request a quote"
              title="Tell us about your project"
              description="Share a few details and a consultant will call within one working day to arrange a site visit. There is no charge for the visit or the quote."
            />
            <dl className="mt-8 space-y-4 text-sm">
              <div>
                <dt className="font-medium">Prefer to talk?</dt>
                <dd className="text-mute"><a href="tel:+2348000000000" className="hover:text-charcoal">+234 800 000 0000</a> · Mon–Sat</dd>
              </div>
              <div>
                <dt className="font-medium">Service areas</dt>
                <dd className="text-mute">Lagos, Abuja, Ibadan, Port Harcourt and surrounding states. Ask about other locations.</dd>
              </div>
            </dl>
          </div>
          <div className="rounded-lg border border-stone bg-white p-6 sm:p-8 lg:col-span-8">
            <ServiceRequestForm defaultServiceType={requested} />
          </div>
        </Container>
      </section>
    </>
  );
}
