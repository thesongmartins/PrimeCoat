import Image from "next/image";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { IMAGES } from "@/lib/content/images";

export function Hero() {
  return (
    <section className="border-b border-stone bg-cream">
      <Container className="grid items-center gap-10 py-14 lg:grid-cols-12 lg:gap-12 lg:py-24">
        <div className="lg:col-span-6">
          <p className="eyebrow">Paint shop &amp; painting services · Nigeria</p>
          <h1 className="mt-4 font-display text-[2.625rem] font-medium leading-[1.02] sm:text-6xl lg:text-[4.25rem]">
            Quality Paints.
            <br />
            Professional Finishes.
          </h1>
          <p className="prose-measure mt-6 text-base leading-relaxed text-charcoal-600 sm:text-lg">
            PrimeCoat supplies premium interior and exterior paints, primers and finishes, and sends skilled crews to apply them.
            Whether you are refreshing one room or coating a whole building, you get colour that lasts and a finish you can be proud of.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/shop" size="lg">
              Shop Paints
            </ButtonLink>
            <ButtonLink href="/services" size="lg" variant="outline">
              Book a Painting Service
            </ButtonLink>
          </div>
          <ul className="mt-10 grid grid-cols-2 gap-x-6 gap-y-3 text-sm text-charcoal-600 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
            {["Pay on Delivery", "Nationwide delivery", "Trade packs available", "Colour consultation"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-terracotta" />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative lg:col-span-6">
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg sm:aspect-[5/4] lg:aspect-[4/5] xl:aspect-[5/4]">
            <Image
              src={`${IMAGES.hero.src}&w=1400&q=80`}
              alt={IMAGES.hero.alt}
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="absolute bottom-4 left-4 flex items-center gap-3 rounded-md bg-warm-white/95 px-3.5 py-2.5 shadow-card backdrop-blur sm:bottom-6 sm:left-6">
            <span className="swatch size-7 rounded-full ring-1 ring-black/10" style={{ ["--swatch" as string]: "#2F5F5C" }} aria-hidden="true" />
            <div className="leading-tight">
              <p className="text-sm font-medium">Lagoon Teal</p>
              <p className="text-xs text-mute">Silk Sheen Interior Emulsion</p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
