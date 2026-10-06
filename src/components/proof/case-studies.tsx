import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, LayoutDashboard } from "lucide-react";
import type { Dictionary } from "@/i18n/types";
import type { Locale } from "@/i18n/config";
import { fmt } from "@/i18n/format";
import { featuredDemos, studioDemos } from "@/lib/demos";
import type { PublicCaseStudy } from "@/lib/proof-cases";
import { DemoBadge, VerifiedBadge } from "./badges";
import demoStyles from "@/app/[locale]/demos/demos.module.css";

/**
 * Mini case studies: client → need → Studio solution → result. Client projects
 * appear only with a documented public consent (src/lib/proof-cases.ts); the
 * interactive demos are always labelled as demonstrations. Every card lets the
 * visitor SEE or TRY something.
 */
export function CaseStudies({ t, locale, cases, demoLimit = 3 }: { t: Dictionary; locale: Locale; cases: PublicCaseStudy[]; demoLimit?: number }) {
  const C = t.pf.cases;
  const fr = locale === "fr";
  // Demos with both a front and an admin side are the most telling ones.
  const demos = featuredDemos(demoLimit);
  const demoOf = (slug: string | null) => (slug ? studioDemos.find((d) => d.slug === slug) ?? null : null);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {cases.map((c) => {
        const demo = demoOf(c.demoSlug);
        return (
          <article key={c.key} className="proof-reveal card flex flex-col overflow-hidden lg:col-span-3 lg:grid lg:grid-cols-[1.1fr_1fr]">
            {c.image && (
              <picture className="block bg-surface-2">
                {c.imageMobile && <source media="(max-width: 639px)" srcSet={c.imageMobile} />}
                <Image src={c.image} alt={c.name} width={1280} height={800} sizes="(min-width: 1024px) 50vw, 100vw"
                  className="aspect-[16/10] size-full object-cover object-top" />
              </picture>
            )}
            <div className="flex flex-col p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <VerifiedBadge label={C.clientLabel} />
                <span className="text-[12.5px] text-muted">{c.sector}</span>
              </div>
              <h3 className="mt-3 text-[24px] font-semibold tracking-tight">{c.name}</h3>
              <dl className="mt-5 grid gap-4 text-[14.5px]">
                <Row label={C.client} value={c.clientType} />
                <Row label={C.need} value={c.problem} />
                <Row label={C.solution} value={c.solution} />
                <div>
                  <dt className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-muted">{C.result}</dt>
                  {c.result ? (
                    <dd className="mt-1 font-medium">{c.result}{c.resultSource && <span className="mt-0.5 block text-[12px] font-normal text-muted">{fmt(C.resultSource, { source: c.resultSource })}</span>}</dd>
                  ) : (
                    <dd className="mt-1 text-[13px] text-muted">{C.noResult}</dd>
                  )}
                </div>
              </dl>
              <div className="mt-6 flex flex-wrap gap-2">
                {c.url && (
                  <a href={c.url} target="_blank" rel="noopener" className="inline-flex h-10 items-center gap-1.5 rounded-full bg-fg px-4 text-[13.5px] font-medium text-bg transition hover:opacity-90">
                    {C.viewProject}<ArrowUpRight className="size-3.5" />
                  </a>
                )}
                {demo && (
                  <Link href={`/${locale}/demos/${demo.slug}`} className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line-strong px-4 text-[13.5px] font-medium transition hover:bg-surface-2">
                    {C.openDemo}<ArrowRight className="flip-rtl size-3.5" />
                  </Link>
                )}
              </div>
            </div>
          </article>
        );
      })}

      {demos.map((d) => (
        <article key={d.slug} className="proof-reveal card group flex flex-col overflow-hidden transition duration-300 hover:-translate-y-0.5 hover:shadow-lift">
          <div className={`${demoStyles.visual} ${demoStyles[d.accent]} !min-h-44`} aria-hidden />
          <div className="flex flex-1 flex-col p-5 sm:p-6">
            <DemoBadge label={C.demoLabel} hint={C.demoNote} className="self-start" />
            <p className="mt-3 text-[11.5px] font-semibold uppercase tracking-[0.12em] text-muted">{d.category}</p>
            <h3 className="mt-1 text-[21px] font-semibold tracking-tight">{d.title}</h3>
            <p className="mt-2 line-clamp-3 flex-1 text-[14px] leading-relaxed text-fg-2">{fr ? d.description : d.descriptionEn}</p>
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {(fr ? d.highlights : d.highlightsEn).slice(0, 3).map((h) => <li key={h} className="rounded-full bg-surface-2 px-2.5 py-1 text-[12px]">{h}</li>)}
            </ul>
            <p className="mt-4 text-[12px] text-muted">{C.demoNote}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/${locale}/demos/${d.slug}`} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-accent px-4 text-[13.5px] font-medium text-accent-fg transition hover:brightness-110">
                {C.viewExample}<ArrowRight className="flip-rtl size-3.5" />
              </Link>
              {d.adminHref && (
                <Link href={`/${locale}/demos/${d.slug}/admin`} className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line-strong px-4 text-[13.5px] font-medium transition hover:bg-surface-2">
                  <LayoutDashboard className="size-3.5" />{C.openAdmin}
                </Link>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</dt>
      <dd className="mt-1 text-fg-2">{value}</dd>
    </div>
  );
}
