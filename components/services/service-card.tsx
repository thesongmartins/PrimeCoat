import { Check } from "lucide-react";
import type { ServiceContent } from "@/lib/content/services";

export function ServiceCard({ service, index }: { service: ServiceContent; index: number }) {
  return (
    <article id={service.type} className="scroll-mt-24 rounded-lg border border-stone bg-white p-6 sm:p-8">
      <span className="font-display text-sm text-terracotta">0{index + 1}</span>
      <h3 className="mt-2 font-display text-2xl font-medium">{service.title}</h3>
      <p className="mt-2 text-[0.9375rem] leading-relaxed text-mute">{service.summary}</p>
      <ul className="mt-5 space-y-2">
        {service.details.map((d) => (
          <li key={d} className="flex items-start gap-2.5 text-sm text-charcoal-600">
            <Check className="mt-0.5 size-4 shrink-0 text-sage" aria-hidden="true" />
            {d}
          </li>
        ))}
      </ul>
    </article>
  );
}
