import Image from "next/image";
import type { Project } from "@/lib/content/projects";
import { PROJECT_CATEGORY_LABELS } from "@/lib/content/projects";
import { cn } from "@/lib/utils/cn";

/**
 * Uniform-height grid: every tile is 4:3; "wide" tiles span two columns at 8:3
 * so rows always line up. "tall" is treated as square to keep the rhythm stable.
 */
export function ProjectsGallery({ projects, className }: { projects: Project[]; className?: string }) {
  return (
    <ul className={cn("grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4", className)}>
      {projects.map((p, i) => {
        const wide = p.aspect === "wide";
        return (
          <li key={p.id} className={cn(wide && "col-span-2")}>
            <figure className={cn("group relative overflow-hidden rounded-lg bg-stone", wide ? "aspect-[8/3]" : "aspect-[4/3]")}>
              <Image
                src={`${p.image.src}&w=${wide ? 1400 : 800}&q=75`}
                alt={p.image.alt}
                fill
                sizes={wide ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, 50vw"}
                className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                loading={i < 2 ? "eager" : "lazy"}
              />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-3 pt-12 text-warm-white sm:p-4">
                <p className="text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-stone-400 sm:text-[0.6875rem]">{PROJECT_CATEGORY_LABELS[p.category]}</p>
                <p className="mt-0.5 font-display text-sm font-medium leading-tight sm:text-lg">{p.title}</p>
                <p className="mt-0.5 hidden text-xs text-stone sm:block">{p.location}</p>
              </figcaption>
            </figure>
          </li>
        );
      })}
    </ul>
  );
}
