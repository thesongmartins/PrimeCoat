import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { ButtonLink } from "@/components/ui/button";
import { IMAGES } from "@/lib/content/images";
import { SERVICES } from "@/lib/content/services";

const FEATURED = ["residential", "commercial", "colour_consultation"] as const;

export function ServicesTeaser() {
  const services = SERVICES.filter((s) => (FEATURED as readonly string[]).includes(s.type));
  return (
    <section className="py-20 sm:py-24">
      <Container className="grid items-center gap-12 lg:grid-cols-12">
        <div className="relative aspect-[4/5] overflow-hidden rounded-lg lg:col-span-5">
          <Image
            src={`${IMAGES.services.src}&w=1000&q=80`}
            alt={IMAGES.services.alt}
            fill
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="object-cover"
          />
        </div>
        <div className="lg:col-span-7">
          <SectionHeading
            eyebrow="Painting services"
            title="Professional painters for homes and businesses"
            description="Our own crews prepare, prime and finish with PrimeCoat products. You get one accountable team from colour choice to final coat."
          />
          <ul className="mt-10 divide-y divide-stone border-y border-stone">
            {services.map((s) => (
              <li key={s.type}>
                <Link href={`/services#${s.type}`} className="group flex items-start justify-between gap-6 py-5">
                  <div>
                    <h3 className="font-display text-xl font-medium group-hover:text-terracotta-700">{s.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-mute">{s.summary}</p>
                  </div>
                  <ArrowRight className="mt-1.5 size-5 shrink-0 text-mute transition-transform group-hover:translate-x-1 group-hover:text-charcoal" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <ButtonLink href="/services#request" size="lg">
              Book a Service
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
