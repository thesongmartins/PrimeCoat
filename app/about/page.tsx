import type { Metadata } from "next";
import Image from "next/image";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { ButtonLink } from "@/components/ui/button";
import { IMAGES } from "@/lib/content/images";

export const metadata: Metadata = {
  title: "About PrimeCoat",
  description: "PrimeCoat is a Nigerian paint company that makes premium coatings and applies them with its own professional crews.",
};

const VALUES = [
  { title: "Honest formulation", body: "We publish coverage figures and finish types for every product, and we only sell what we would put on our own walls." },
  { title: "Preparation first", body: "Most paint failures are preparation failures. Our crews prime, fill and sand before a single topcoat goes on." },
  { title: "Colour for Nigerian light", body: "Our palette is developed and tested under the bright, warm light of Lagos and Abuja, not a northern-European studio." },
  { title: "Respect for your home", body: "Furniture covered, floors protected, tidy at the end of every day. We treat your space as if it were ours." },
];

export default function AboutPage() {
  return (
    <>
      <section className="border-b border-stone bg-cream">
        <Container className="grid items-center gap-10 py-14 lg:grid-cols-12 lg:py-20">
          <div className="lg:col-span-6">
            <SectionHeading
              as="h1"
              eyebrow="About PrimeCoat"
              title="A paint company that also picks up the brush"
              description="PrimeCoat began as a small painting crew in Lagos that could not find paint good enough for the finishes clients wanted. So we started making it. Today we supply premium coatings across Nigeria and still send our own painters to apply them."
            />
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg lg:col-span-6">
            <Image src={`${IMAGES.about.src}&w=1400&q=80`} alt={IMAGES.about.alt} fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionHeading eyebrow="What we believe" title="Four principles behind every tin" />
          </div>
          <ul className="grid gap-8 sm:grid-cols-2 lg:col-span-8">
            {VALUES.map((v) => (
              <li key={v.title} className="border-t border-charcoal pt-5">
                <h3 className="font-display text-xl font-medium">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mute">{v.body}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="border-t border-stone bg-white py-16 sm:py-20">
        <Container className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionHeading eyebrow="How to buy" title="Shop online, pay when it arrives" />
          </div>
          <div className="prose-measure space-y-4 text-[0.9375rem] leading-relaxed text-charcoal-600 lg:col-span-7">
            <p>Browse the shop, add paints and tools to your cart and check out with your delivery address. We confirm the order by email immediately and deliver to your door. You pay the driver on delivery, so there is no risk in trying us for the first time.</p>
            <p>Need advice on quantities or colours before you order? Book a colour consultation or call the shop. Trade customers can ask about 20 L contractor packs and project pricing.</p>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <ButtonLink href="/shop">Shop Paints</ButtonLink>
              <ButtonLink href="/contact" variant="outline">Contact us</ButtonLink>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
