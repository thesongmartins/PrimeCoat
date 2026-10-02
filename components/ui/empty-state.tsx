import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface Props {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-stone-400/80 bg-cream/60 px-6 py-16 text-center",
        className,
      )}
    >
      {icon && <div className="mb-5 text-terracotta">{icon}</div>}
      <h2 className="font-display text-2xl font-medium">{title}</h2>
      {description && <p className="mt-2 max-w-md text-[0.9375rem] leading-relaxed text-mute">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
