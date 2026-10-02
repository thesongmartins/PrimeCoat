import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

type Tone = "neutral" | "success" | "warning" | "danger" | "accent" | "info";

const tones: Record<Tone, string> = {
  neutral: "bg-stone-200 text-charcoal-600",
  success: "bg-success-100 text-success",
  warning: "bg-ochre-100 text-[#8a6418]",
  danger: "bg-danger-100 text-danger",
  accent: "bg-terracotta-100 text-terracotta-700",
  info: "bg-sage-100 text-[#4f5f4c]",
};

export function Badge({ tone = "neutral", className, ...props }: ComponentProps<"span"> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.75rem] font-medium tracking-tight",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
