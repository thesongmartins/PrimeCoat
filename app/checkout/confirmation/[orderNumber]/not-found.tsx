import { PackageSearch } from "lucide-react";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";

export default function ConfirmationNotFound() {
  return (
    <Container className="py-20">
      <EmptyState
        icon={<PackageSearch className="size-10" aria-hidden="true" />}
        title="We couldn't find that order"
        description="It may belong to a different account. Your own orders are listed in your order history."
        action={<ButtonLink href="/orders">Go to order history</ButtonLink>}
      />
    </Container>
  );
}
