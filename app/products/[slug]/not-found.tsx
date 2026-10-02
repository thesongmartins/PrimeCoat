import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { PaintBucket } from "lucide-react";

export default function ProductNotFound() {
  return (
    <Container className="py-20">
      <EmptyState
        icon={<PaintBucket className="size-10" aria-hidden="true" />}
        title="We couldn't find that product"
        description="It may have been renamed or retired from the range. Browse the full shop to find an alternative."
        action={
          <ButtonLink href="/shop" size="lg">
            Browse Paints
          </ButtonLink>
        }
      />
    </Container>
  );
}
