import { PackageSearch } from "lucide-react";
import { AccountShell } from "@/components/account/account-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";

export default function OrderNotFound() {
  return (
    <AccountShell title="Order not found">
      <EmptyState
        icon={<PackageSearch className="size-10" aria-hidden="true" />}
        title="We couldn't find that order"
        description="It may belong to a different account, or the link may be incomplete. Check your order history for the full list."
        action={<ButtonLink href="/orders">Go to order history</ButtonLink>}
      />
    </AccountShell>
  );
}
