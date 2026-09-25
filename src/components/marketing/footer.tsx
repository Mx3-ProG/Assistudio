import Link from "next/link";
import type { Dictionary } from "@/i18n/types";
import type { Locale } from "@/i18n/config";
import { Logo } from "./logo";

export function Footer({ t, locale }: { t: Dictionary; locale: Locale }) {
  const p = (path: string) => `/${locale}${path}`;
  const cols = [
    { title: t.footer.product, links: [[p("/studio"), "STUDIO"], [p("/pricing"), t.nav.pricing], [p("/partners"), t.footer.partners], [p("/faq"), t.footer.faq]] },
    { title: t.footer.company, links: [[p("/about"), t.footer.about], [p("/contact"), t.footer.contact], [p("/security"), t.footer.security]] },
    {
      title: t.footer.legal,
      links: [[p("/legal"), t.footer.legalNotice], [p("/privacy"), t.footer.privacy], [p("/cookies"), t.footer.cookies], [p("/terms"), t.footer.terms], [p("/affiliate-terms"), t.footer.affiliateTerms]],
    },
  ];
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-[13px] text-muted">{t.footer.tagline}</p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <h3 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted">{c.title}</h3>
            <ul className="mt-4 space-y-2.5">
              {c.links.map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="text-[13px] text-fg-2 hover:text-fg">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto max-w-6xl px-4 pb-10 text-[12px] text-muted sm:px-6">
        © {new Date().getFullYear()} STUDIO. {t.footer.rights}
      </div>
    </footer>
  );
}
