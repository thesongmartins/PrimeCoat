import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";

const PALETTE = ["#EDE6DA", "#D9A99A", "#9AA88F", "#2F5F5C", "#B8623F", "#2E2E33"];

export function ConsultationCta() {
  return (
    <section className="py-20 sm:py-24">
      <Container>
        <div className="grid items-center gap-8 rounded-lg border border-stone bg-cream px-6 py-10 sm:px-10 lg:grid-cols-12 lg:py-14">
          <div className="lg:col-span-8">
            <p className="eyebrow">Colour consultation</p>
            <h2 className="mt-3 font-display text-3xl font-medium leading-tight sm:text-4xl">Not sure which white is the right white?</h2>
            <p className="prose-measure mt-3 text-[0.9375rem] leading-relaxed text-mute sm:text-base">
              Book a consultation and we will bring large swatches to your space, test them in your light and leave you with a written palette plan.
            </p>
          </div>
          <div className="flex flex-col gap-5 lg:col-span-4 lg:items-end">
            <div className="flex -space-x-2">
              {PALETTE.map((hex) => (
                <span key={hex} className="swatch size-9 rounded-full ring-2 ring-cream" style={{ ["--swatch" as string]: hex }} aria-hidden="true" />
              ))}
            </div>
            <ButtonLink href="/services#request" size="lg">
              Book a consultation
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
