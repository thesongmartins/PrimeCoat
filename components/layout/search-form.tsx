"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useId } from "react";
import { cn } from "@/lib/utils/cn";

export function SearchForm({ className, autoFocus, onSubmitted }: { className?: string; autoFocus?: boolean; onSubmitted?: () => void }) {
  const router = useRouter();
  const params = useSearchParams();
  const id = useId();
  return (
    <form
      role="search"
      className={cn("relative", className)}
      onSubmit={(e) => {
        e.preventDefault();
        const q = new FormData(e.currentTarget).get("q")?.toString().trim() ?? "";
        router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
        onSubmitted?.();
      }}
    >
      <label htmlFor={id} className="sr-only">
        Search products
      </label>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-mute" aria-hidden="true" />
      <input
        id={id}
        name="q"
        type="search"
        autoFocus={autoFocus}
        defaultValue={params.get("q") ?? ""}
        placeholder="Search paints, colours, tools…"
        className="h-11 w-full rounded-md border border-stone-400/70 bg-white pl-10 pr-3.5 text-sm placeholder:text-stone-400 focus:border-charcoal focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
      />
    </form>
  );
}
