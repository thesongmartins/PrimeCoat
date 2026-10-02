import type { Metadata } from "next";
import { Mail, MapPin, Phone, Clock } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { ServiceRequestForm } from "@/components/services/service-request-form";

export const metadata: Metadata = {
  title: "Contact PrimeCoat",
  description: "Visit the PrimeCoat showroom in Victoria Island, Lagos, call us, or send a request for a quote.",
};

const DETAILS = [
  { icon: MapPin, label: "Showroom", value: "12 Adeola Odeku Street, Victoria Island, Lagos" },
  { icon: Phone, label: "Phone", value: "+234 800 000 0000", href: "tel:+2348000000000" },
  { icon: Mail, label: "Email", value: "hello@primecoat.ng", href: "mailto:hello@primecoat.ng" },
  { icon: Clock, label: "Hours", value: "Mon–Fri 8am–6pm · Sat 9am–4pm" },
];

export default function ContactPage() {
  return (
    <Container className="py-14 sm:py-20">
      <SectionHeading
        as="h1"
        eyebrow="Contact"
        title="Talk to PrimeCoat"
        description="Questions about an order, a colour or a painting project? Call, email or visit the showroom, or send us the form below and we will call you back."
      />
      <div className="mt-12 grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <ul className="space-y-6">
            {DETAILS.map((d) => (
              <li key={d.label} className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-md bg-cream text-terracotta">
                  <d.icon className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-mute">{d.label}</p>
                  {d.href ? (
                    <a href={d.href} className="mt-1 block text-[0.9375rem] font-medium hover:text-terracotta-700">{d.value}</a>
                  ) : (
                    <p className="mt-1 text-[0.9375rem] font-medium">{d.value}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-stone bg-white p-6 sm:p-8 lg:col-span-8">
          <h2 className="font-display text-2xl font-medium">Request a call back or quote</h2>
          <p className="mt-1 mb-6 text-sm text-mute">For product questions, pick “Colour consultation” and tell us what you need.</p>
          <ServiceRequestForm />
        </div>
      </div>
    </Container>
  );
}
