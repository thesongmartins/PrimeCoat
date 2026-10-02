import { LogOut } from "lucide-react";
import { signOut } from "@/app/auth/actions";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export function SignOutButton({ className, variant = "outline", size = "md" }: { className?: string; variant?: "outline" | "ghost" | "primary"; size?: "sm" | "md" | "lg" }) {
  return (
    <form action={signOut}>
      <button type="submit" className={cn(buttonVariants({ variant, size }), className)}>
        <LogOut className="size-4" aria-hidden="true" /> Sign out
      </button>
    </form>
  );
}
