import Link from "next/link";
import { Check, X } from "lucide-react";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { requireAffiliate } from "@/lib/auth";
import { repo } from "@/lib/data";
import { formatMoney } from "@/lib/money";
import { salesContext, ofKind } from "@/lib/sales/server";
import { PageHeader, EmptyState } from "@/components/ui/primitives";
import { BackLink } from "@/components/sales-center/back-link";
import { TrackedCopy } from "@/components/sales-center/tracked-copy";
import { FallbackBadge } from "@/components/sales-center/fallback-badge";

/** "Understand Studio": the pitch at 15 s / 30 s / when interested, what the client buys, the three offers, the questions. */
export default async function PitchPage({ params }: PageProps<"/[locale]/dashboard/sales-center/pitch">) {
  const { locale } = (await params) as { locale: Locale };
  const s = await requireAffiliate(locale);
  const [t, ctx, offers] = await Promise.all([getDictionary(locale), salesContext(s, locale), repo().listOffers()]);
  const P = t.cp.pitch;
  const pitch = ofKind(ctx.content, "pitch")[0];
  const diagnostic = ofKind(ctx.content, "diagnostic")[0];
  const base = `/${locale}/dashboard/sales-center`;
  if (!pitch) return <div className="space-y-6"><BackLink href={base} label={t.cp.title} /><PageHeader title={P.title} /><div className="card"><EmptyState title={t.sc.empty} /></div></div>;
  const b = pitch.body;
  const lengths = [[P.short, b.short], [P.medium, b.medium], [P.long, b.long]] as const;
  return (
    <div className="space-y-6">
      <BackLink href={base} label={t.cp.title} />
      <PageHeader title={P.title} subtitle={P.subtitle} />
      <section className="card relative overflow-hidden border-accent/30 p-6 sm:p-8">
        <div className="pointer-events-none absolute -end-16 -top-16 size-56 rounded-full bg-accent/20 blur-3xl" />
        <p className="relative text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">{P.oneLiner}</p>
        <p className="relative mt-2 text-[24px] font-semibold leading-tight tracking-tight sm:text-[30px]">{b.oneLiner}</p>
        <div className="relative mt-3"><FallbackBadge show={pitch.fallback} label={t.sc.englishFallback} /></div>
      </section>
      <div className="grid gap-4 lg:grid-cols-3">
        {lengths.map(([label, text]) => (
          <section key={label} className="card flex flex-col p-5">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">{label}</h2>
            <p className="mt-2 flex-1 whitespace-pre-line text-[15px] leading-relaxed">{text}</p>
            <TrackedCopy value={text} kind="pitch" contentKey={pitch.key} className="mt-4 self-start" />
          </section>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-5"><h2 className="font-semibold">{P.problem}</h2><p className="mt-2 text-[15px] leading-relaxed text-fg-2">{b.problem}</p></section>
        <section className="card p-5"><h2 className="font-semibold">{P.forWhom}</h2><p className="mt-2 text-[15px] leading-relaxed text-fg-2">{b.forWhom}</p></section>
        <section className="card p-5">
          <h2 className="font-semibold">{P.whatTheyBuy}</h2>
          <ul className="mt-3 grid gap-2">{b.whatTheyBuy.map((x) => <li key={x} className="flex gap-2 text-[15px]"><Check className="mt-0.5 size-4 shrink-0 text-success" />{x}</li>)}</ul>
        </section>
        {b.notThis?.length ? (
          <section className="card p-5">
            <h2 className="font-semibold">{P.notThis}</h2>
            <ul className="mt-3 grid gap-2">{b.notThis.map((x) => <li key={x} className="flex gap-2 text-[15px]"><X className="mt-0.5 size-4 shrink-0 text-danger" />{x}</li>)}</ul>
          </section>
        ) : null}
      </div>
      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-[17px] font-semibold">{P.offers}</h2>
          <Link href={`/${locale}/pricing`} target="_blank" className="text-[13px] font-medium text-accent hover:underline">{t.cp.sheet.seeOffers} →</Link>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {offers.map((o) => {
            const plan = t.pricing.plans[o.tier];
            return (
              <article key={o.tier} className="card p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{plan.badge}</p>
                <h3 className="mt-1 text-[18px] font-semibold">{plan.name}</h3>
                <p className="tabular mt-1 text-[15px] font-medium">{formatMoney(o.priceCents, locale, o.currency)} <span className="text-muted">· {o.interval === "one_time" ? t.pricing.oneTime : t.pricing.perYear}</span></p>
                <p className="mt-3 text-[14px] font-medium">{plan.tagline}</p>
                <p className="mt-1 text-[13.5px] text-muted">{plan.audience}</p>
              </article>
            );
          })}
        </div>
      </section>
      {diagnostic && (
        <section id="questions">
          <h2 className="mb-1 text-[17px] font-semibold">{P.questions}</h2>
          {diagnostic.body.intro && <p className="mb-3 text-[14px] text-muted">{diagnostic.body.intro}</p>}
          <ol className="grid gap-3 md:grid-cols-2">
            {diagnostic.body.questions.map((q, i) => (
              <li key={q.question} className="card p-4">
                <p className="text-[15px] font-semibold"><span className="text-accent">{i + 1}. </span>{q.question}</p>
                <p className="mt-2 text-[13.5px]"><span className="text-muted">{P.listenFor} · </span>{q.listenFor}</p>
                <p className="mt-1 text-[13.5px]"><span className="text-muted">{P.studio} · </span>{q.studio}</p>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
