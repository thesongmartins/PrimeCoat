"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { Button, ButtonLink } from "@/components/ui/button";

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(JSON.stringify({ level: "error", event: "app.render_error", digest: error.digest, message: error.message }));
  }, [error]);

  return (
    <Container className="py-24">
      <EmptyState
        icon={<AlertTriangle className="size-10" aria-hidden="true" />}
        title="Something went wrong"
        description="We hit a snag loading this page. Please try again, and if it keeps happening, contact us."
        action={
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="button" onClick={() => retry()}>Try again</Button>
            <ButtonLink href="/" variant="outline">Go home</ButtonLink>
          </div>
        }
      />
    </Container>
  );
}
