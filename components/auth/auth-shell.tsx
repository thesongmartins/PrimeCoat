import type { ReactNode } from "react";
import Image from "next/image";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/layout/logo";
import { IMAGES } from "@/lib/content/images";

export function AuthShell({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Container className="py-10 sm:py-16">
      <div className="grid overflow-hidden rounded-lg border border-stone bg-white lg:grid-cols-2">
        <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
          <Logo />
          <h1 className="mt-10 font-display text-3xl font-medium sm:text-4xl">{title}</h1>
          {description && <p className="mt-3 text-[0.9375rem] leading-relaxed text-mute">{description}</p>}
          <div className="mt-8">{children}</div>
        </div>
        <div className="relative hidden min-h-[620px] lg:block">
          <Image src={`${IMAGES.heroSecondary.src}&w=1200&q=80`} alt={IMAGES.heroSecondary.alt} fill sizes="50vw" className="object-cover" />
        </div>
      </div>
    </Container>
  );
}

export function AuthDivider() {
  return (
    <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.14em] text-mute" role="separator">
      <span className="h-px flex-1 bg-stone" /> or <span className="h-px flex-1 bg-stone" />
    </div>
  );
}

export function FormAlert({ tone = "error", children }: { tone?: "error" | "success"; children: ReactNode }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={
        tone === "error"
          ? "rounded-md border border-danger/30 bg-danger-100 px-4 py-3 text-sm text-danger"
          : "rounded-md border border-success/30 bg-success-100 px-4 py-3 text-sm text-success"
      }
    >
      {children}
    </p>
  );
}
