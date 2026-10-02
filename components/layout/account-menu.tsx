import Image from "next/image";
import Link from "next/link";
import { Package, User, LogOut } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { signOut } from "@/app/auth/actions";
import { cn } from "@/lib/utils/cn";

/** Session-aware account control in the header. Server component. */
export async function AccountMenu({ className }: { className?: string }) {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <Link
        href="/login"
        className={cn(
          "flex h-10 items-center gap-1.5 rounded-md px-2 text-charcoal transition-colors hover:bg-stone-200 sm:gap-2 sm:px-3",
          className,
        )}
      >
        <User className="size-5" aria-hidden="true" />
        <span className="whitespace-nowrap text-[0.8125rem] font-medium sm:text-sm">Sign in</span>
      </Link>
    );
  }

  const initial = (user.fullName ?? user.email).charAt(0).toUpperCase();

  return (
    <details className={cn("group relative", className)}>
      <summary
        className="flex size-10 cursor-pointer list-none items-center justify-center rounded-md hover:bg-stone-200 [&::-webkit-details-marker]:hidden"
        aria-label={`Account menu for ${user.fullName ?? user.email}`}
      >
        {user.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt=""
            width={32}
            height={32}
            className="size-8 rounded-full ring-1 ring-black/10"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="grid size-8 place-items-center rounded-full bg-charcoal text-sm font-semibold text-warm-white">
            {initial}
          </span>
        )}
      </summary>
      <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-stone bg-white p-2 shadow-lift">
        <div className="px-3 py-2">
          <p className="truncate text-sm font-medium">
            {user.fullName ?? "PrimeCoat customer"}
          </p>
          <p className="truncate text-xs text-mute">{user.email}</p>
        </div>
        <div className="my-1 border-t border-stone" />
        <Link
          href="/account"
          className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-stone-200"
        >
          <User className="size-4 text-mute" aria-hidden="true" /> My account
        </Link>
        <Link
          href="/orders"
          className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-stone-200"
        >
          <Package className="size-4 text-mute" aria-hidden="true" /> Orders
        </Link>
        <div className="my-1 border-t border-stone" />
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm hover:bg-stone-200"
          >
            <LogOut className="size-4 text-mute" aria-hidden="true" />
            Sign out
          </button>
        </form>
      </div>
    </details>
  );
}
