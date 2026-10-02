"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/auth/actions";
import { buttonVariants, Spinner } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface Props {
  className?: string;
  variant?: "outline" | "ghost" | "primary";
  size?: "sm" | "md" | "lg";
  /** Render as a bare menu row instead of a button. */
  unstyled?: boolean;
  onDone?: () => void;
}

/**
 * Signs out via the server action, then refreshes the router so server components
 * (header, account menu) re-render in their signed-out state even when the redirect
 * target is the page we're already on.
 */
export function SignOutButton({ className, variant = "outline", size = "md", unstyled = false, onDone }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await signOut();
      onDone?.();
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-busy={pending || undefined}
      className={unstyled ? className : cn(buttonVariants({ variant, size }), className)}
    >
      {pending ? <Spinner /> : <LogOut className="size-4" aria-hidden="true" />}
      Sign out
    </button>
  );
}
