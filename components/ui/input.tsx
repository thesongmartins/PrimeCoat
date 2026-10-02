import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

const fieldBase =
  "w-full rounded-md border bg-white px-3.5 text-[0.9375rem] text-charcoal placeholder:text-stone-400 transition-colors " +
  "border-stone-400/70 hover:border-charcoal-600 focus:border-charcoal focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta " +
  "disabled:cursor-not-allowed disabled:bg-stone-200 aria-[invalid=true]:border-danger";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(fieldBase, "h-11", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(fieldBase, "min-h-28 py-2.5 leading-relaxed", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select className={cn(fieldBase, "h-11 appearance-none pr-10", className)} {...props}>
        {children}
      </select>
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-mute"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      >
        <path d="m5 7.5 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn("mb-1.5 block text-sm font-medium text-charcoal", className)} {...props} />;
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-[0.8125rem] text-danger">
      {message}
    </p>
  );
}

export function FieldHint({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} className="mt-1.5 text-[0.8125rem] text-mute">
      {children}
    </p>
  );
}
