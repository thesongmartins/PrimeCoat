import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface Props {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  align?: "left" | "center";
  className?: string;
  as?: "h1" | "h2";
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = "left",
  className,
  as: Tag = "h2",
}: Props) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        align === "center" && "sm:flex-col sm:items-center sm:text-center",
        className,
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <Tag className={cn("font-display font-medium leading-[1.1]", Tag === "h1" ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl")}>
          {title}
        </Tag>
        {description && <p className="mt-3 text-[0.9375rem] leading-relaxed text-mute sm:text-base">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
