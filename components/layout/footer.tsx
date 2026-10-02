import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Logo } from "./logo";
import { CATEGORY_LABELS } from "@/types/product";

const SHOP_LINKS = (["interior", "exterior", "primer", "gloss", "accessories", "tools"] as const).map((c) => ({
  href: `/shop?category=${c}`,
  label: CATEGORY_LABELS[c],
}));

const COMPANY_LINKS = [
  { href: "/services", label: "Painting Services" },
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About PrimeCoat" },
  { href: "/contact", label: "Contact" },
];

const ACCOUNT_LINKS = [
  { href: "/account", label: "My account" },
  { href: "/orders", label: "Order history" },
  { href: "/cart", label: "Cart" },
];

export function Footer() {
  return (
    <footer className="mt-24 bg-charcoal text-stone">
      <Container className="grid gap-12 py-16 md:grid-cols-12">
        <div className="md:col-span-4">
          <Logo inverse />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-stone-400">
            Quality Paints. Professional Finishes. Premium paints and professional painting services for homes and businesses across Nigeria.
          </p>
          <address className="mt-6 text-sm not-italic leading-relaxed text-stone-400">
            12 Adeola Odeku Street, Victoria Island, Lagos
            <br />
            <a href="tel:+2348000000000" className="hover:text-warm-white">+234 800 000 0000</a>
            <br />
            <a href="mailto:hello@primecoat.ng" className="hover:text-warm-white">hello@primecoat.ng</a>
          </address>
        </div>
        <FooterColumn title="Shop" links={SHOP_LINKS} />
        <FooterColumn title="Company" links={COMPANY_LINKS} />
        <FooterColumn title="Account" links={ACCOUNT_LINKS} />
        <div className="md:col-span-2">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-warm-white">Opening hours</h2>
          <dl className="mt-4 space-y-2 text-sm text-stone-400">
            <div className="flex justify-between gap-4"><dt>Mon – Fri</dt><dd>8am – 6pm</dd></div>
            <div className="flex justify-between gap-4"><dt>Saturday</dt><dd>9am – 4pm</dd></div>
            <div className="flex justify-between gap-4"><dt>Sunday</dt><dd>Closed</dd></div>
          </dl>
        </div>
      </Container>
      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-3 py-6 text-xs text-stone-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} PrimeCoat Paints Ltd. All rights reserved.</p>
          <p>Pay on Delivery available nationwide.</p>
        </Container>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: ReadonlyArray<{ href: string; label: string }> }) {
  return (
    <div className="md:col-span-2">
      <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-warm-white">{title}</h2>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-sm text-stone-400 transition-colors hover:text-warm-white">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
