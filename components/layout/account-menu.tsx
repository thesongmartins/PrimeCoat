import Link from "next/link";
import { User } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Phase 2: static link to the account page. Phase 3 replaces this with a
 * session-aware menu (avatar, Orders, Sign out).
 */
export function AccountMenu({ className }: { className?: string }) {
  return (
    <Link
      href="/account"
      className={cn("grid size-10 place-items-center rounded-md text-charcoal transition-colors hover:bg-stone-200", className)}
      aria-label="Account"
    >
      <User className="size-5" aria-hidden="true" />
    </Link>
  );
}
