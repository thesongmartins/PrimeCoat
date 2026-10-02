import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <Container className="py-24">
      <EmptyState
        icon={<Compass className="size-10" aria-hidden="true" />}
        title="This page hasn't been painted yet"
        description="The link may be out of date. Head back to the shop or the homepage."
        action={
          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/shop">Browse Paints</ButtonLink>
            <ButtonLink href="/" variant="outline">Go home</ButtonLink>
          </div>
        }
      />
    </Container>
  );
}
