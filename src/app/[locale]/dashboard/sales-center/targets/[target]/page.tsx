import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Plus, UserPlus, AlertTriangle, MessageSquareText, ShieldQuestion, Images, Repeat, HelpCircle, Sparkles } from "lucide-react";
import { getDictionary } from "@/i18n";
import { fmt } from "@/i18n/format";
import type { Locale } from "@/i18n/config";
import { requireAffiliate } from "@/lib/auth";
import { repo } from "@/lib/data";
import { formatMoney } from "@/lib/money";
import { marketContent } from "@/content/markets";
import { salesContext, ofKind } from "@/lib/sales/server";
import { relatedToSector } from "@/lib/sales/sectors";
import { personalize } from "@/lib/sales/personalize";
import { PageHeader, Badge } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";
import { BackLink } from "@/components/sales-center/back-link";
import { TrackedCopy } from "@/components/sales-center/tracked-copy";
import { MarketIcon } from "@/components/marketing/markets-grid";
import { CaseStudyCard } from "@/components/copilot/case-study-card";

/**
 * Sector sheet — "I have a prospect in this sector": what to say, what to ask,
 * what to show, which offer, how to answer objections, which messages and
 * follow-ups to send. Everything comes from `markets` + `sales_content`.
 */
export default async function SectorSheet({ params }: PageProps<"/[locale]/dashboard/sales-center/targets/[target]">) {
  const { locale, target } = (await params) as { locale: Locale; target: string };
  const s = await requireAffiliate(locale);
  const [t, ctx, offers] = await Promise.all([getDictionary(locale), salesContext(s, locale), repo().listOffers()]);
  const m = ctx.marketBySlug(target);
  if (!m) notFound();
  const c = marketContent(m, locale);
  const H = t.cp.sheet;
  const base = `/${locale}/dashboard/sales-center`;
  const url = ctx.urlForTarget(target);
  const fill = (text: string) => personalize(text, { advisorName: ctx.advisorName, affiliateUrl: url, sector: c.name }, t.sc.messages.vars).text;
  const generic = <T extends { targetKey: string | null }>(xs: T[]) => xs.filter((x) => x.targetKey === null);

  const pitch = ofKind(ctx.content, "pitch")[0];
  const diagnostic = ofKind(ctx.content, "diagnostic")[0];
  const allCases = ofKind(ctx.content, "case_study");
  const related = relatedToSector(allCases, m);
  const cases = (related.length ? related : allCases).slice(0, 3);
  const objectionsAll = ofKind(ctx.content, "objection");
  const objections = [...new Set([...relatedToSector(objectionsAll, m), ...generic(objectionsAll)])].slice(0, 6);
  const messagesAll = ofKind(ctx.content, "message").filter((x) => x.stage === "first_contact" || x.stage === "interested");
  const messages = [...new Set([...relatedToSector(messagesAll, m), ...generic(messagesAll)])].slice(0, 3);
  const sequence = ofKind(ctx.content, "sequence").find((x) => x.stage === "follow_up");
  const offer = c.offer ? offers.find((o) => o.tier === c.offer) : undefined;
  const plan = offer ? t.pricing.plans[offer.tier] : null;
  const hasPage = !!ctx.pageForTarget(target);
  const questions = [...(c.discovery ?? []), ...(diagnostic?.body.questions.slice(0, Math.max(0, 6 - (c.discovery?.length ?? 0))).map((q) => q.question) ?? [])];

  return (
    <div className="space-y-6">
      <BackLink href={base} label={t.cp.title} />
      <PageHeader
        title={<span className="flex items-center gap-3"><MarketIcon name={m.icon} className="size-7 text-accent" />{c.name}</span>}
        subtitle={c.problem}
        action={<Link href={`/${locale}/dashboard/prospects/start?sector=${target}`} className={buttonClass("accent", "md")}><UserPlus className="size-4" />{H.addProspect}</Link>}
      />

      {/* 1. What to say */}
      <section className="card relative overflow-hidden border-accent/30 p-5 sm:p-7">
        <div className="pointer-events-none absolute -end-16 -top-16 size-56 rounded-full bg-accent/15 blur-3xl" />
        <h2 className="relative flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent"><Sparkles className="size-3.5" />{fmt(H.pitchFor, { sector: c.name })}</h2>
        <p className="relative mt-2 text-[18px] font-medium leading-relaxed sm:text-[20px]">{c.angle}</p>
        {pitch && (
          <div className="relative mt-4 rounded-2xl bg-surface-2/80 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{H.pitch15}</p>
            <p className="mt-1 text-[15px] leading-relaxed">{pitch.body.short}</p>
            <TrackedCopy value={pitch.body.short} kind="pitch" contentKey={pitch.key} className="mt-3" />
          </div>
        )}
        {c.avoid && <p className="relative mt-4 flex gap-2 rounded-xl bg-warning-soft px-3 py-2 text-[13.5px]"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" /><span><strong>{H.avoid} · </strong>{c.avoid}</span></p>}
      </section>

      {/* 2. Their problems / what they want / what to ask */}
      <div className="grid gap-4 lg:grid-cols-3">
        {[[H.pains, c.pains ?? [c.problem]], [H.outcomes, c.outcomes ?? []]].map(([title, xs]) => (xs as string[]).length ? (
          <section key={title as string} className="card p-5">
            <h2 className="font-semibold">{title as string}</h2>
            <ul className="mt-3 grid gap-2">{(xs as string[]).map((x) => <li key={x} className="rounded-xl bg-surface-2 px-3 py-2 text-[14px]">{x}</li>)}</ul>
          </section>
        ) : null)}
        <section className="card p-5">
          <h2 className="flex items-center gap-2 font-semibold"><HelpCircle className="size-4 text-accent" />{H.questions}</h2>
          <ol className="mt-3 grid gap-2">{questions.map((q, i) => <li key={q} className="text-[14px]"><span className="font-semibold text-accent">{i + 1}. </span>{q}</li>)}</ol>
          {diagnostic && <Link href={`${base}/pitch#questions`} className="mt-3 inline-block text-[13px] font-medium text-accent hover:underline">{H.allQuestions} →</Link>}
        </section>
      </div>

      {/* 3. What to show */}
      {cases.length > 0 && (
        <section>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="flex items-center gap-2 text-[17px] font-semibold"><Images className="size-4 text-accent" />{H.show}</h2>
              <p className="text-[13px] text-muted">{related.length ? H.showHint : H.otherProjects}</p>
            </div>
            <Link href={`${base}/assets?target=${target}`} className="text-[13px] font-medium text-accent hover:underline">{t.common.viewAll} →</Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {cases.map((x) => <CaseStudyCard key={x.id} t={t} item={x} link={url} compact />)}
          </div>
        </section>
      )}

      {/* 4. Offer + page */}
      <div className="grid gap-4 lg:grid-cols-2">
        {offer && plan && (
          <section className="card p-5">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">{H.offer}</h2>
            <p className="mt-2 text-[20px] font-semibold">{plan.name} <span className="tabular text-[15px] font-medium text-muted">· {formatMoney(offer.priceCents, locale, offer.currency)} {offer.interval === "one_time" ? t.pricing.oneTime : t.pricing.perYear}</span></p>
            <p className="mt-1 text-[14px]">{plan.tagline}</p>
            <p className="mt-2 text-[12.5px] text-muted">{H.offerHint}</p>
            <Link href={`${base}/pitch`} className="mt-3 inline-block text-[13px] font-medium text-accent hover:underline">{H.seeOffers} →</Link>
          </section>
        )}
        <section className="card p-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">{H.page}</h2>
          <p className="mt-2 truncate rounded-xl bg-surface-2 px-3 py-2 font-mono text-[13px]" dir="ltr">{url}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <TrackedCopy value={url} variant="accent" size="md" />
            {hasPage
              ? <a href={url} target="_blank" rel="noopener" className={buttonClass("secondary", "md")}><ExternalLink className="size-4" />{t.sc.preview}</a>
              : <Link href={`${base}/pages?new=1&target=${target}`} className={buttonClass("secondary", "md")}><Plus className="size-4" />{t.sc.start.createPage}</Link>}
          </div>
        </section>
      </div>

      {/* 5. Objections */}
      {objections.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-[17px] font-semibold"><ShieldQuestion className="size-4 text-accent" />{H.objections}</h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {objections.map((o) => (
              <li key={o.key} className="card p-4">
                <p className="font-semibold">{o.body.objection}</p>
                <p className="mt-2 text-[14.5px] leading-relaxed">{o.body.short}</p>
                <details className="mt-2 text-[14px]">
                  <summary className="cursor-pointer select-none font-medium text-accent">{H.longAnswer}</summary>
                  <p className="mt-2 leading-relaxed text-fg-2">{o.body.long}</p>
                </details>
                <p className="mt-2 text-[13px]"><Badge tone="accent">{H.nextStep}</Badge> {o.body.nextStep}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 6. Messages + follow-ups */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-3 flex items-center gap-2 font-semibold"><MessageSquareText className="size-4 text-accent" />{H.messages}</h2>
          <ul className="grid gap-3">
            {[{ key: `market:${m.slug}`, title: c.name, text: c.message }, ...messages.map((x) => ({ key: x.key, title: x.title, text: x.body.text }))].map((x) => (
              <li key={x.key}>
                <p className="text-[12px] font-medium text-muted">{x.title}</p>
                <p className="mt-1 whitespace-pre-line rounded-xl bg-surface-2 p-3 text-[14px] leading-relaxed">{fill(x.text)}</p>
                <TrackedCopy value={fill(x.text)} kind="message" contentKey={x.key.startsWith("market:") ? undefined : x.key} className="mt-2" />
              </li>
            ))}
          </ul>
        </section>
        {sequence && (
          <section className="card p-5">
            <h2 className="mb-3 flex items-center gap-2 font-semibold"><Repeat className="size-4 text-accent" />{H.followUps}</h2>
            <ol className="grid gap-3">
              {sequence.body.steps.map((st) => (
                <li key={st.day} className="grid grid-cols-[3.25rem_1fr] gap-3">
                  <span className="tabular grid h-7 place-items-center rounded-full bg-accent-soft text-[12px] font-semibold text-accent">J+{st.day}</span>
                  <div>
                    <p className="text-[13px] font-medium">{st.goal} <span className="text-muted">· {t.sc.channels[st.channel]}</span></p>
                    <p className="mt-1 text-[13.5px] text-fg-2">{fill(st.text)}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Link href={`${base}/follow-ups`} className="mt-3 inline-block text-[13px] font-medium text-accent hover:underline">{t.cp.intents.followUp.title} →</Link>
          </section>
        )}
      </div>
    </div>
  );
}
