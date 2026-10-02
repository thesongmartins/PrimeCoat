"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface Props {
  value: number;
  min?: number;
  max: number;
  onChange: (value: number) => void;
  size?: "sm" | "md";
  label?: string;
  className?: string;
}

export function QuantityStepper({ value, min = 1, max, onChange, size = "md", label = "Quantity", className }: Props) {
  const clamp = (n: number) => Math.min(Math.max(n, min), Math.max(max, min));
  const btn = cn(
    "flex items-center justify-center text-charcoal transition-colors hover:bg-stone-200 disabled:opacity-40 disabled:hover:bg-transparent",
    size === "sm" ? "size-9" : "size-11",
  );
  return (
    <div
      className={cn(
        "inline-flex items-stretch rounded-md border border-stone-400/70 bg-white",
        className,
      )}
      role="group"
      aria-label={label}
    >
      <button type="button" className={btn} onClick={() => onChange(clamp(value - 1))} disabled={value <= min} aria-label="Decrease quantity">
        <Minus className="size-4" aria-hidden="true" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        className={cn(
          "w-12 border-x border-stone-400/70 text-center text-sm font-medium tabular-nums focus:outline-none",
          size === "sm" ? "h-9" : "h-11",
        )}
        value={value}
        min={min}
        max={max}
        aria-label={label}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(clamp(n));
        }}
      />
      <button type="button" className={btn} onClick={() => onChange(clamp(value + 1))} disabled={value >= max} aria-label="Increase quantity">
        <Plus className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
