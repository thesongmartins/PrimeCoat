import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CATEGORY_LABELS, type ProductCategory } from "@/types/product";
import { cn } from "@/lib/utils/cn";

const TILES: { category: ProductCategory; blurb: string; swatches: string[] }[] = [
  { category: "interior", blurb: "Matt, silk and washable emulsions", swatches: ["#EDE6DA", "#9AA88F", "#D9A99A", "#2F5F5C"] },
  { category: "exterior", blurb: "Weather-resistant façade paints", swatches: ["#F7F6F2", "#D4C4A8", "#6E7178"] },
  { category: "primer", blurb: "Sealers and undercoats", swatches: ["#E8E3DC", "#9C9EA3"] },
  { category: "gloss", blurb: "Enamels for doors, trims and metal", swatches: ["#FFFFFF", "#C8322B", "#111113"] },
  { category: "accessories", blurb: "Tape, trays, sandpaper and cloths", swatches: ["#F2E3B5", "#1B1B1F"] },
  { category: "tools", blurb: "Rollers, brushes and mixers", swatches: ["#C65D3B", "#8A5A3C"] },
];

export function CategoryTiles({ className }: { className?: string }) {
  return (
    <ul className={cn("grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6", className)}>
      {TILES.map((t) => (
        <li key={t.category}>
          <Link
            href={`/shop?category=${t.category}`}
            className="group flex h-full flex-col justify-between rounded-lg border border-stone bg-white p-4 transition-colors hover:border-charcoal sm:p-5"
          >
            <div className="flex -space-x-1.5">
              {t.swatches.map((hex) => (
                <span key={hex} className="swatch size-6 rounded-full ring-2 ring-white" style={{ ["--swatch" as string]: hex }} aria-hidden="true" />
              ))}
            </div>
            <div className="mt-8">
              <span className="flex items-center justify-between gap-2 font-display text-lg font-medium">
                {CATEGORY_LABELS[t.category]}
                <ArrowUpRight className="size-4 text-mute transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-charcoal" aria-hidden="true" />
              </span>
              <span className="mt-1 block text-[0.8125rem] leading-snug text-mute">{t.blurb}</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
