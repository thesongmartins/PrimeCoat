"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const LINKS = [
  { href: "/account", label: "Account", icon: User },
  { href: "/orders", label: "Orders", icon: Package },
];

export function AccountNav({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Account" className="flex gap-1 overflow-x-auto rounded-lg border border-stone bg-white p-1 lg:flex-col">
      {LINKS.map((l) => {
        const active = pathname === l.href || pathname.startsWith(l.href + "/");
        return (
          <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined} className={cn("flex items-center gap-2.5 rounded-md px-3.5 py-2.5 text-sm font-medium whitespace-nowrap", active ? "bg-charcoal text-warm-white" : "text-charcoal-600 hover:bg-stone-200")}>
            <l.icon className="size-4" aria-hidden="true" /> {l.label}
          </Link>
        );
      })}
      {children}
    </nav>
  );
}
