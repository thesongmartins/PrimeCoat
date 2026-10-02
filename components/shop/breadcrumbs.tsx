import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Fragment } from "react";

export function Breadcrumbs({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-mute">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => (
          <Fragment key={item.label}>
            {i > 0 && <ChevronRight className="size-3.5" aria-hidden="true" />}
            <li>
              {item.href ? (
                <Link href={item.href} className="hover:text-charcoal">
                  {item.label}
                </Link>
              ) : (
                <span aria-current="page" className="text-charcoal">
                  {item.label}
                </span>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
