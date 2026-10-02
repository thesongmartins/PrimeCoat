"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select, Label } from "@/components/ui/input";
import { SORT_OPTIONS } from "@/lib/products/filters";

export function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="sort" className="mb-0 whitespace-nowrap text-sm text-mute">
        Sort by
      </Label>
      <Select
        id="sort"
        value={value}
        className="h-10 w-48 text-sm"
        onChange={(e) => {
          const next = new URLSearchParams(params.toString());
          next.set("sort", e.target.value);
          router.push(`${pathname}?${next.toString()}`);
        }}
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
