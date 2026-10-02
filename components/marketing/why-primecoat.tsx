import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { WHY_PRIMECOAT } from "@/lib/content/services";

export function WhyPrimeCoat() {
  return (
    <section className="bg-charcoal py-20 text-stone sm:py-24">
      <Container>
        <SectionHeading
          eyebrow="Why PrimeCoat"
          title="Paint made for this climate, applied by people who care"
          description="We make the paint and we do the painting, so every product is tested in real Nigerian homes before it reaches the shelf."
          className="[&_h2]:text-warm-white [&_p:not(.eyebrow)]:text-stone-400"
        />
        <ol className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-5">
          {WHY_PRIMECOAT.map((item, i) => (
            <li key={item.title} className="border-t border-white/15 pt-6">
              <span className="font-display text-sm text-terracotta">0{i + 1}</span>
              <h3 className="mt-3 font-display text-xl font-medium text-warm-white">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-stone-400">{item.body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
