import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Target, HelpCircle, Images, MessageSquareText, AlertTriangle, BadgeCheck, Pencil, BookOpen, ExternalLink } from "lucide-react";
import { getDictionary } from "@/i18n";
import { fmt } from "@/i18n/format";
import type { Locale } from "@/i18n/config";
import { requireAffiliate } from "@/lib/auth";
import { repo } from "@/lib/data";
import { formatDate, formatRelative } from "@/lib/money";
import { marketContent } from "@/content/markets";
import { salesContext, ofKind } from "@/lib/sales/server";
import { relatedToSector } from "@/lib/sales/sectors";
import { personalize, whatsappHref, mailtoHref } from "@/lib/sales/personalize";
import { guideFor, recommend, repliesFor } from "@/lib/sales/guide";
import { Badge } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";
import { TrackedCopy } from "@/components/sales-center/tracked-copy";
import { CaseStudyCard } from "@/components/copilot/case-study-card";
import { OutcomeButtons, FollowUpSentButton } from "@/components/guided/outcome-buttons";
import { ReplyPicker } from "@/components/guided/reply-picker";
import { HandOffPanel } from "@/components/guided/handoff-panel";

/**
 * One prospect, one question: "what do I do now?". Why → what to do → what to
 * say → what to show → and then? Everything else (replies, hand-over,
 * history) is below and secondary.
 */
export default async function ProspectGuide({ params }: PageProps<"/[locale]/dashboard/prospects/[id]">) {
  const { locale, id } = (await params) as { locale: Locale; id: string };
  const s = await requireAffiliate(locale);
  const [t, ctx, prospects, events, offers] = await Promise.all([
    getDictionary(locale), salesContext(s, locale), repo().listProspects(s), repo().listProspectEvents(s, id), repo().listOffers(),
  ]);
  const p = prospects.find((x) => x.id === id);
  if (!p) notFound();
  const P = t.gd.prospect;
  const dash = `/${locale}/dashboard`;
  const market = ctx.markets.find((m) => m.id === p.marketId) ?? null;
  const mc = market ? marketContent(market, locale) : null;
  const sector = market?.slug ?? null;
  const url = ctx.urlForTarget(sector);
  const relation = (events.find((e) => e.type === "created")?.payload.relation as string | undefined) ?? null;

  const guide = guideFor(ofKind(ctx.content, "stage_guide"), p.stage, sector)?.body ?? null;
  const sequences = ofKind(ctx.content, "sequence").map((x) => ({ key: x.key, stage: x.stage, steps: x.body.steps }));
  // eslint-disable-next-line react-hooks/purity -- request-time snapshot for the recommendation
  const now = Date.now();
  const rec = recommend(p, sequences, now);

  // A business name alone is not a first name: leave [First name] visible for the ambassador to fill.
  const vars = { firstName: p.company ? p.name.split(" ")[0] : null, company: p.company ?? p.name, advisorName: ctx.advisorName, affiliateUrl: url, sector: mc?.name };
  const fill = (x: string) => personalize(x, vars, t.sc.messages.vars).text;

  // What to say: the sector's own first message (unless it's a close relation → warm tone),
  // else a message of the step's stage — matching tone first, channel-neutral before channel-specific.
  const tone = relation === "close" ? "ton:chaleureux" : relation === "cold" ? "ton:direct" : null;
  const messages = ofKind(ctx.content, "message").filter((m) => m.stage === guide?.say);
  const rank = (m: (typeof messages)[number]) => (tone && m.tags.includes(tone) ? 0 : 2) + (!m.channel || m.channel === "other" ? 0 : 1);
  const pool = [...(market ? relatedToSector(messages, market) : []), ...messages.filter((x) => !x.targetKey)];
  const best = [...pool].sort((a, b) => rank(a) - rank(b))[0];
  const message = guide?.say === "first_contact" && mc?.message && tone !== "ton:chaleureux"
    ? { key: null, text: mc.message }
    : best ? { key: best.key, text: best.body.text } : null;
  // No canned message at a conversation step (understand / spark interest): the sector's angle is what to say.
  const angle = !guide?.say && ["replied", "qualified", "interested"].includes(p.stage) ? mc?.angle ?? ofKind(ctx.content, "pitch")[0]?.body.short ?? null : null;
  const sayText = rec.mode === "follow_up" && rec.step ? fill(rec.step.text) : message ? fill(message.text) : angle;

  // What to show.
  const cases = ofKind(ctx.content, "case_study");
  const proofs = (market ? relatedToSector(cases, market) : []).concat(market ? [] : cases).slice(0, 2);
  const questions = guide?.ask === "yes" ? [...(mc?.discovery ?? []), ...(ofKind(ctx.content, "diagnostic")[0]?.body.questions.map((q) => q.question) ?? [])].slice(0, 3) : [];

  const replies = ["new", "won"].includes(p.stage) ? [] : repliesFor(ofKind(ctx.content, "reply"), p.stage).map((r) => ({
    key: r.key, said: r.body.said, level: r.body.level, meaning: r.body.meaning, answer: fill(r.body.answer), question: r.body.question, next: r.body.next, to: r.body.to,
    proof: r.body.show === "case_study" && proofs[0] ? { label: proofs[0].body.name, href: `${dash}/sales-center/assets${sector ? `?target=${sector}` : ""}#${proofs[0].key}` }
      : r.body.show === "offer" || r.body.show === "page" ? { label: P.sendPage, href: url } : null,
  }));
  const planned = p.nextActionAt && Date.parse(p.nextActionAt) > now ? p.nextActionAt : null;


  return (
    <div className="space-y-5">
      <Link href={`${dash}/prospects`} className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-fg"><ArrowLeft className="flip-rtl size-4" />{P.back}</Link>
      <header className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.03em] sm:text-[32px]">{p.name}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-[14px] text-muted">
            {p.company && <span>{p.company}</span>}
            <Badge tone="accent">{t.dash.prospects.stages[p.stage]}</Badge>
            {mc ? <Link href={`${dash}/sales-center/targets/${sector}`} className="hover:underline">{mc.name}</Link> : null}
          </p>
        </div>
        <Link href={`${dash}/prospects?edit=${p.id}`} className={buttonClass("ghost", "sm")}><Pencil className="size-4" />{P.edit}</Link>
      </header>
      {!mc && <p className="rounded-xl bg-warning-soft px-3 py-2 text-[13.5px]">{P.noSector}</p>}

      {/* The one thing to do now */}
      <section className="card relative overflow-hidden border-accent/40 p-5 shadow-md sm:p-7">
        <div className="pointer-events-none absolute -end-16 -top-16 size-56 rounded-full bg-accent/15 blur-3xl" />
        <div className="relative grid gap-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-accent">{P.next}</p>
          {!guide ? <p className="text-[15px] text-muted">{P.noGuide}</p> : (
            <>
              <h2 className="text-[22px] font-semibold leading-snug tracking-tight sm:text-[26px]">
                {rec.mode === "follow_up" && rec.step ? `${rec.step.goal} (J+${rec.step.day})` : guide.action}
              </h2>
              <p className="text-[15px] text-fg-2">
                <strong>{P.why} · </strong>
                {rec.mode === "follow_up" ? fmt(P.followUpDue, { n: rec.daysSince }) : rec.mode === "wait" && rec.waitUntil ? fmt(rec.daysSince === 0 ? P.waitToday : P.wait, { n: rec.daysSince, date: formatDate(rec.waitUntil, locale) }) : guide.why}
              </p>
              {planned && <p className="flex items-center gap-2 text-[13.5px] text-muted"><Clock className="size-4" />{fmt(P.planned, { action: p.nextAction ?? "", when: formatRelative(planned, locale) })}</p>}
              <p className="text-[13.5px]"><span className="text-muted">{P.goal} · </span><strong>{guide.goal}</strong></p>

              {((sayText && rec.mode !== "wait") || questions.length > 0 || !!guide.collect?.length || (guide.show === "case_study" && proofs.length > 0) || guide.show === "page" || guide.show === "offer" || !!guide.dont) && (
              <div className="grid gap-4 rounded-2xl bg-surface/80 p-4 ring-1 ring-line">
                {sayText && rec.mode !== "wait" && (
                  <Row icon={MessageSquareText} label={P.say}>
                    <p className="whitespace-pre-line rounded-xl bg-surface-2 p-3 text-[14.5px] leading-relaxed">{sayText}</p>
                    <div className="flex flex-wrap gap-2">
                      <TrackedCopy value={sayText} kind={rec.mode === "follow_up" ? "sequence" : "message"} contentKey={rec.mode === "follow_up" ? rec.sequenceKey ?? undefined : message?.key ?? undefined} variant="accent" size="md" />
                      {p.phone && <a href={whatsappHref(sayText, p.phone)} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "md")}>WhatsApp</a>}
                      {p.email && <a href={mailtoHref(p.email, p.company ?? p.name, sayText)} className={buttonClass("secondary", "md")}>Email</a>}
                    </div>
                  </Row>
                )}
                {questions.length > 0 && (
                  <Row icon={HelpCircle} label={P.ask}>
                    <ol className="grid gap-1.5">{questions.map((q, i) => <li key={q} className="text-[14.5px]"><span className="font-semibold text-accent">{i + 1}. </span>{q}</li>)}</ol>
                  </Row>
                )}
                {guide.collect?.length ? (
                  <Row icon={Target} label={P.collect}>
                    <ul className="grid gap-1">{guide.collect.map((c) => <li key={c} className="text-[14px]">□ {c}</li>)}</ul>
                  </Row>
                ) : null}
                {guide.show === "case_study" && proofs.length > 0 && (
                  <Row icon={Images} label={P.show}>
                    <div className="grid gap-3 md:grid-cols-2">{proofs.map((x) => <CaseStudyCard key={x.id} t={t} item={x} link={url} compact />)}</div>
                  </Row>
                )}
                {(guide.show === "page" || guide.show === "offer") && (
                  <Row icon={Images} label={P.show}>
                    <p className="truncate rounded-xl bg-surface-2 px-3 py-2 font-mono text-[13px]" dir="ltr">{url}</p>
                    <div className="flex flex-wrap gap-2">
                      <TrackedCopy value={url} size="md" />
                      <a href={url} target="_blank" rel="noopener" className={buttonClass("secondary", "md")}><ExternalLink className="size-4" />{P.open}</a>
                    </div>
                    {guide.show === "offer" && (
                      <ul className="grid gap-1.5 sm:grid-cols-3">
                        {offers.map((o) => <li key={o.tier} className="rounded-xl bg-surface-2 px-3 py-2 text-[13px]"><strong>{t.pricing.plans[o.tier].name}</strong><br /><span className="text-muted">{t.pricing.plans[o.tier].tagline}</span></li>)}
                      </ul>
                    )}
                  </Row>
                )}
                {guide.dont && <p className="flex gap-2 text-[13.5px]"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" /><span><strong>{P.dont} · </strong>{guide.dont}</span></p>}
              </div>
              )}

              <div className="grid gap-2">
                <p className="text-[13px] font-semibold">{P.then}</p>
                <div className="flex flex-wrap gap-2">
                  {rec.mode === "follow_up" && rec.sequenceKey && <FollowUpSentButton prospectId={p.id} sequenceKey={rec.sequenceKey} />}
                  {guide.outcomes?.length ? <OutcomeButtons prospectId={p.id} outcomes={guide.outcomes} /> : null}
                </div>
              </div>
              {guide.escalate && <p className="text-[13px] text-muted"><a href="#handoff" className="font-medium text-accent hover:underline">{t.gd.handoff.button} →</a> {guide.escalate}</p>}
            </>
          )}
        </div>
      </section>

      {replies.length > 0 && <ReplyPicker prospectId={p.id} replies={replies} />}

      <HandOffPanel prospectId={p.id} done={p.stage === "handed_off"} hasEmail={!!p.email} />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-3 text-[15px] font-semibold">{P.history}</h2>
          {events.length ? (
            <ol className="grid gap-2">
              {events.slice(0, 20).map((e) => (
                <li key={e.id} className="flex items-center gap-2 text-[13.5px]">
                  <BadgeCheck className="size-4 shrink-0 text-success" />
                  <span className="flex-1">{P.events[e.type]}{e.type === "stage_changed" && e.stage ? ` · ${t.dash.prospects.stages[e.stage]}` : ""}</span>
                  <span className="text-[12px] text-muted">{formatRelative(e.createdAt, locale)}</span>
                </li>
              ))}
            </ol>
          ) : <p className="text-[13.5px] text-muted">{formatDate(p.createdAt, locale)} · {P.events.created}</p>}
        </section>
        <section className="card grid content-start gap-2 p-5">
          <Link href={`${dash}/sales-center/facts`} className="flex items-center gap-2 text-[14px] font-medium text-accent hover:underline"><BookOpen className="size-4" />{P.officialInfo}</Link>
          {mc && <Link href={`${dash}/sales-center/targets/${sector}`} className="flex items-center gap-2 text-[14px] font-medium text-accent hover:underline"><Target className="size-4" />{P.openSector} · {mc.name}</Link>}
        </section>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, children }: { icon: typeof Target; label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5 border-t border-line pt-4 first:border-t-0 first:pt-0">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-accent"><Icon className="size-3.5" />{label}</p>
      {children}
    </div>
  );
}
