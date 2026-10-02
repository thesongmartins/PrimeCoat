import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { AccountNav } from "./account-nav";

export function AccountShell({ title, description, action, navExtra, children }: { title: string; description?: string; action?: ReactNode; navExtra?: ReactNode; children: ReactNode }) {
  return (
    <Container className="py-10 sm:py-14">
      <SectionHeading as="h1" eyebrow="My account" title={title} description={description} action={action} />
      <div className="mt-10 grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-3">
          <AccountNav>{navExtra}</AccountNav>
        </div>
        <div className="lg:col-span-9">{children}</div>
      </div>
    </Container>
  );
}
