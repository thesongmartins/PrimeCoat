import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export function Logo({ className, inverse = false }: { className?: string; inverse?: boolean }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2.5", className)} aria-label="PrimeCoat home">
      <span
        aria-hidden="true"
        className={cn(
          "grid size-8 place-items-center rounded-sm",
          inverse ? "bg-warm-white" : "bg-charcoal",
        )}
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none">
          <path d="M5 4h9a5 5 0 0 1 0 10H9v6H5V4Z" fill={inverse ? "#1B1B1F" : "#FAF8F5"} />
          <path d="M9 8h5a1 1 0 0 1 0 2H9V8Z" fill="#C65D3B" />
        </svg>
      </span>
      <span className={cn("hidden font-display text-xl font-semibold tracking-tight min-[360px]:inline sm:text-[1.375rem]", inverse ? "text-warm-white" : "text-charcoal")}>
        PrimeCoat
      </span>
    </Link>
  );
}
