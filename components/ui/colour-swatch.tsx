import { cn } from "@/lib/utils/cn";

export function ColourSwatch({ hex, name, size = "sm", className }: { hex: string | null; name?: string | null; size?: "sm" | "lg"; className?: string }) {
  if (!hex) return null;
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn("swatch inline-block shrink-0 rounded-full ring-1 ring-inset ring-black/10", size === "sm" ? "size-3.5" : "size-6")}
        style={{ ["--swatch" as string]: hex }}
        aria-hidden="true"
      />
      {name && <span className="text-sm text-mute">{name}</span>}
    </span>
  );
}
