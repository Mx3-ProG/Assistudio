import Link from "next/link";
import { ArrowRight, CalendarClock, Sparkles, Hourglass, BadgeCheck, Check, ChevronDown } from "lucide-react";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { fmt } from "@/i18n/format";
import { requireAffiliate } from "@/lib/auth";
import { repo } from "@/lib/data";
import { formatMoney, formatNumber, formatRelative } from "@/lib/money";
import { computeCommissionCents } from "@/lib/commission";
import { Card, CardHeader, Notice, Badge } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";
import { LiveSales } from "@/components/dashboard/live-sales";
import { EarningsChart } from "@/components/dashboard/earnings-chart";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { GoalCard } from "@/components/dashboard/goal-card";
import { QuickActions } from "@/components/sales-center/quick-actions";
import { salesContext, nextActions, ofKind } from "@/lib/sales/server";
import { reachedCounts, firstSalePath } from "@/lib/sales/guide";
import { marketContent } from "@/content/markets";
import { FirstSaleStarter } from "@/components/guided/first-sale-starter";
import { primaryAction } from "@/lib/sales/primary-action";
import { checklistDone, CHECKLIST_SIZE } from "@/lib/sales/onboarding-checklist";
import { ESSENTIALS } from "@/content/help-videos";
import { summarize } from "@/lib/help/videos";
import { NewHere } from "@/components/help/new-here";
import { TourButton } from "@/components/help/tour-button";
import { reviewMoment } from "@/lib/proof";
import { publicTestimonials } from "@/lib/proof-server";
import { ReviewPrompt } from "@/components/proof/review-prompt";
import { Testimonials } from "@/components/proof/testimonials";

function greeting(t: Awaited<ReturnType<typeof getDictionary>>, name: string) {
  const h = new Date().getHours();
  const tpl = h < 12 ? t.dash.greetingMorning : h < 18 ? t.dash.greetingAfternoon : t.dash.greetingEvening;
  return fmt(tpl, { name });
}

/** Question: "How am I doing?" */
export default async function Overview({ params }: PageProps<"/[locale]/dashboard">) {
  const { locale } = (await params) as { locale: Locale };
  const s = await requireAffiliate(locale);
  const t = await getDictionary(locale);
  const [o, offer, fin, sales, next, prospects, events, saleRows] = await Promise.all([
    repo().getOverview(s, "all"), repo().getOffer(), repo().getFinancialOverview(s), salesContext(s, locale),
    nextActions(s, locale), repo().listProspects(s), repo().listProspectEvents(s), repo().listSales(s),
  ]);
  const b = fin.balances;
  const cur = fin.currency;
  const first = (s.displayName || s.fullName).split(" ")[0];
  const base = `/${locale}/dashboard`;
  const K = t.dash.kpi;

  // Money the affiliate can rely on vs money still in validation vs projections:
  // three visual languages that never blend.
  const money = [
    { value: formatMoney(fin.revenueGeneratedCents, locale, cur), label: K.revenueGenerated, hint: K.revenueGeneratedHint, href: `${base}/sales` },
    { value: formatMoney(b.lifetimeEarnedCents, locale, cur), label: K.lifetime, hint: K.lifetimeHint, tone: "text-success", href: `${base}/commissions` },
    { value: formatMoney(b.availableCents, locale, cur), label: K.available, hint: K.availableHint, tone: "text-accent", href: `${base}/payouts` },
    { value: formatMoney(b.pendingCents, locale, cur), label: K.pendingValidation, hint: K.pendingValidationHint, tone: "text-warning", pending: true, href: `${base}/commissions` },
    { value: formatMoney(b.paidCents, locale, cur), label: K.paid, href: `${base}/payouts` },
  ];
  const pipeline = [
    { value: formatNumber(fin.recurringContracts, locale), label: K.recurringContracts, href: `${base}/recurring` },
    { value: formatMoney(fin.potentialNext12mCents, locale, cur), label: K.potential12m, hint: K.potential12mHint, projection: true, href: `${base}/recurring` },
    { value: formatNumber(o.opportunities, locale), label: K.opportunities, href: `${base}/prospects` },
    { value: formatNumber(o.clicks, locale), label: K.clicks, href: `${base}/link` },
  ];
  const L = t.dash.latestSale;
  const ls = fin.latestSale;
  // V0.5: before the first sale the home is about the next action, not about zeros.
  const paidSales = saleRows.filter((x) => x.status === "paid").length;
  const beginner = paidSales === 0;
  const reached = reachedCounts(prospects, events);
  const path = firstSalePath({
    profileDone: !!s.affiliate.onboardingCompletedAt || s.affiliate.onboardingStep > 0, approved: s.affiliate.status === "approved",
    reached, sales: paidSales, commissionAvailable: b.availableCents + b.paidCents > 0,
  });
  const W = t.gd.home.wins;
  const wins = [
    [W.prospects, reached.new], [W.messages, reached.contacted], [W.replies, reached.replied], [W.needs, reached.qualified],
    [W.proofs, reached.proof_sent], [W.meetings, Math.max(reached.appointment, reached.handed_off)], [W.quotes, reached.checkout], [W.sales, paidSales],
  ] as const;
  // ONE main action, always: the ambassador never wonders what to do next.
  const top = next[0];
  const primary = primaryAction({
    onboardingDone: !!s.affiliate.onboardingCompletedAt,
    prospectCount: prospects.length,
    top: top ? { id: top.prospect.id, name: top.prospect.name, stage: top.prospect.stage, mode: top.rec.mode } : null,
  });
  const P = t.hc.activation.primary[primary.kind];
  // "Give my review" after a milestone, once (any review given — even withdrawn — silences it).
  const [mine, appProof] = await Promise.all([repo().listMyTestimonials(s).catch(() => []), publicTestimonials({ placement: "app", limit: 6 })]);
  const moment = mine.length ? null : reviewMoment({ sales: paidSales, commissions: b.pendingCents + b.availableCents + b.paidCents > 0 ? 1 : 0, payoutsPaid: b.paidCents > 0 ? 1 : 0 });
  const sources = ofKind(sales.content, "find_source").map((x) => ({ key: x.key, title: x.title, how: x.body.how, action: x.body.action, tip: x.body.tip }));

  const numbers = (
    <>

      <section className="grid gap-3 md:grid-cols-2">
        <Link href={`${base}/sales-center`} className="card group p-5 transition hover:-translate-y-0.5 hover:shadow-md sm:p-6"><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">{t.sc.home.sell}</p><h2 className="mt-2 text-[22px] font-semibold">{t.sc.title}</h2><p className="mt-1 text-[14px] text-muted">{t.sc.subtitle}</p><span className="mt-5 flex items-center gap-1 text-[13px] font-medium text-accent">{t.sc.startSelling}<ArrowRight className="flip-rtl size-4"/></span></Link>
        <Link href={`${base}/commissions`} className="card group p-5 transition hover:-translate-y-0.5 hover:shadow-md sm:p-6"><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-success">{t.sc.home.earn}</p><h2 className="mt-2 text-[22px] font-semibold">{formatMoney(b.lifetimeEarnedCents,locale,cur)}</h2><p className="mt-1 text-[14px] text-muted">{t.sc.home.flow}</p><span className="mt-5 flex items-center gap-1 text-[13px] font-medium text-accent">{t.sc.quick.commissions}<ArrowRight className="flip-rtl size-4"/></span></Link>
      </section>
      <QuickActions link={sales.defaultLink} pageUrl={sales.pageForTarget(null) ? sales.urlForTarget(null) : null} />

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5" aria-label={t.dash.nav.commissions}>
        {money.map((k, i) => (
          <Link key={k.label} href={k.href} title={k.hint}
            className={`card group p-4 transition hover:-translate-y-0.5 hover:shadow-md sm:p-5 ${k.pending ? "border-dashed border-warning/50" : ""}`}
            style={{ animationDelay: `${i * 40}ms` }}>
            <div className={`tabular flex items-center gap-1.5 text-[22px] font-semibold leading-none tracking-[-0.03em] sm:text-[26px] ${k.tone ?? ""}`}>
              {k.pending && <Hourglass className="size-4 shrink-0" aria-hidden />}{k.value}
            </div>
            <div className="mt-2 text-[13px] text-muted">{k.label}</div>
            {k.hint && <div className="mt-1 hidden text-[11px] leading-snug text-muted/80 sm:block">{k.hint}</div>}
          </Link>
        ))}
      </section>
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {pipeline.map((k) => (
          <Link key={k.label} href={k.href} title={k.hint}
            className={`card p-4 transition hover:shadow-md sm:p-5 ${k.projection ? "border-dashed bg-[repeating-linear-gradient(135deg,var(--accent-soft)_0_6px,transparent_6px_12px)]" : ""}`}>
            <div className="tabular text-[20px] font-semibold leading-none tracking-[-0.03em] sm:text-[22px]">{k.value}</div>
            <div className="mt-2 text-[13px] text-muted">{k.label}</div>
            {k.projection && <Badge tone="neutral" className="mt-2">{K.notGuaranteed}</Badge>}
          </Link>
        ))}
      </section>

      {ls && (
        <Link href={`${base}/commissions`} className="card flex flex-col gap-3 p-5 transition hover:shadow-md sm:flex-row sm:items-center sm:p-6">
          <div className="flex-1">
            <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted">{L.title} · {formatRelative(ls.at, locale)}</p>
            <p className="mt-1 text-[17px] font-semibold">{ls.kind === "renewal" ? L.renewal : L.newSale} <span className="text-muted">· {ls.ref}</span></p>
            <p className="tabular mt-0.5 text-[14px] text-fg-2">{fmt(L.generated, { amount: formatMoney(ls.grossCents, locale, cur) })}</p>
          </div>
          {ls.commissionCents !== null && ls.commissionStatus && (
            <span className={
              ls.commissionStatus === "pending" || ls.commissionStatus === "disputed"
                ? "tabular inline-flex items-center gap-2 self-start rounded-full border border-dashed border-warning/60 bg-warning-soft px-4 py-2 text-[14px] font-semibold text-warning sm:self-auto"
                : ls.commissionStatus === "reversed"
                  ? "inline-flex items-center gap-2 self-start rounded-full bg-danger-soft px-4 py-2 text-[14px] font-semibold text-danger sm:self-auto"
                  : "tabular inline-flex items-center gap-2 self-start rounded-full bg-success-soft px-4 py-2 text-[14px] font-semibold text-success sm:self-auto"
            }>
              {ls.commissionStatus === "pending" || ls.commissionStatus === "disputed" ? <Hourglass className="size-4" /> : <BadgeCheck className="size-4" />}
              {ls.commissionStatus === "reversed" ? L.reversed
                : fmt(ls.commissionStatus === "pending" ? L.pending : ls.commissionStatus === "disputed" ? L.disputed
                  : ls.commissionStatus === "paid" ? L.paid : L.available, { amount: formatMoney(ls.commissionCents, locale, cur) })}
            </span>
          )}
        </Link>
      )}
      {moment && <ReviewPrompt t={t} moment={moment} href={`${base}/review`} />}
      <LiveSales affiliateId={s.affiliate.id} locale={locale} text={t.dash.live} enabled={!s.isDemo} />

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="min-w-0 space-y-6">
          <EarningsChart points={o.earnings} />
        </div>
        <div className="min-w-0 space-y-6">
          <GoalCard target={o.goal.target} current={o.goal.current} commissionPerSaleCents={computeCommissionCents(offer.priceCents, s.affiliate.commissionRate)} />
          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <span className="animate-pulse-dot size-2 rounded-full bg-success" />
                  {t.dash.activityTitle}
                </span>
              }
            />
            <div className="mt-2 pb-2">
              <ActivityFeed events={o.activity} t={t} locale={locale} />
            </div>
          </Card>
        </div>
      </div>
      <Testimonials items={appProof} title={t.pf.amb.testimonialsTitle} />
    </>
  );

  return (
    <div className="space-y-6">
      <header className="animate-rise flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.035em] sm:text-[40px]">{greeting(t, first)}</h1>
          <p className="mt-1 text-[15px] text-muted">{t.dash.overviewSubtitle}</p>
        </div>
        <div className="shrink-0 pt-1"><TourButton /></div>
      </header>

      <Link href={`${base}${primary.path}`} data-tour="next-action"
        className="card group relative flex flex-col gap-4 overflow-hidden border-accent/40 p-5 transition hover:shadow-md sm:flex-row sm:items-center sm:p-6">
        <div className="pointer-events-none absolute -end-20 -top-20 size-56 rounded-full bg-accent/15 blur-3xl" />
        <div className="relative min-w-0 flex-1">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-accent">{t.hc.activation.primary.eyebrow}</p>
          <h2 className="mt-1 text-[22px] font-semibold tracking-tight sm:text-[26px]">{P.title}</h2>
          <p className="mt-1 text-[14.5px] text-fg-2">{fmt(P.body, { name: primary.prospect?.name ?? "" })}</p>
        </div>
        <span className={buttonClass("accent", "lg", "relative w-full sm:w-auto")}>{P.cta}<ArrowRight className="flip-rtl size-4" /></span>
      </Link>

      {!s.affiliate.onboardingCompletedAt && primary.kind !== "onboarding" && (
        <Link href={`${base}/welcome`} className="card flex items-center gap-4 border-accent/30 bg-accent-soft p-4 transition hover:shadow-md">
          <Sparkles className="size-5 shrink-0 text-accent" />
          <span className="flex-1 text-[14px] font-medium">{fmt(t.hc.activation.resume, { done: checklistDone(s.affiliate.onboardingStep), total: CHECKLIST_SIZE })}</span>
          <ArrowRight className="flip-rtl size-4 text-accent" />
        </Link>
      )}
      {s.affiliate.status === "pending" && s.role === "affiliate" && <Notice tone="warning">{t.dash.onboarding.pendingNote}</Notice>}

      {/* New partners (no paid sale yet): the 3 essential tutorials + the guided-tour offer, until they hide it. */}
      {beginner && <NewHere videos={ESSENTIALS.map((v) => summarize(v, locale, t))} base={base} />}

      {beginner && (
        <section className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <div className="card relative overflow-hidden border-accent/30 p-5 sm:p-7">
            <div className="pointer-events-none absolute -end-16 -top-16 size-56 rounded-full bg-accent/15 blur-3xl" />
            <p className="relative text-[12px] font-semibold uppercase tracking-[0.14em] text-accent">{t.gd.home.eyebrow}</p>
            <h2 className="relative mt-1 text-[24px] font-semibold tracking-tight sm:text-[28px]">{t.gd.home.title}</h2>
            <div className="relative mt-4">
              <FirstSaleStarter sectors={sales.markets.map((m) => ({ slug: m.slug, name: marketContent(m, locale).name })).sort((a, b) => a.name.localeCompare(b.name, locale))} sources={sources} />
            </div>
          </div>
          <div className="card p-5 sm:p-6">
            <h2 className="text-[15px] font-semibold">{t.gd.path.title}</h2>
            <ol className="mt-3 grid gap-2">
              {path.map((x, n) => (
                <li key={x.key} className="flex items-center gap-3 text-[14px]">
                  <span className={`grid size-6 shrink-0 place-items-center rounded-full text-[12px] font-semibold ${x.done ? "bg-success text-white" : "bg-surface-2 text-muted"}`}>{x.done ? <Check className="size-3.5" /> : n + 1}</span>
                  <span className={x.done ? "text-muted line-through decoration-muted/40" : ""}>{t.gd.path.steps[x.key]}</span>
                </li>
              ))}
            </ol>
            {s.affiliate.status !== "approved" && s.role === "affiliate" && <p className="mt-3 text-[12.5px] text-muted">{t.gd.path.pending}</p>}
          </div>
        </section>
      )}

      <Card>
        <CardHeader
          title={<span className="flex items-center gap-2"><CalendarClock className="size-4 text-accent" />{t.gd.home.actionsTitle}</span>}
          action={<Link href={`${base}/prospects`} className="text-[13px] text-accent hover:underline">{t.common.viewAll}</Link>}
        />
        {next.length ? (
          <ul className="mt-3 divide-y divide-line">
            {next.slice(0, 5).map(({ prospect: p, rec, label }) => (
              <li key={p.id}>
                <Link href={`${base}/prospects/${p.id}`} className="flex items-center gap-3 px-5 py-3 transition hover:bg-surface-2/50 sm:px-6">
                  <div className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-2 text-[13px] font-semibold">{p.name[0]}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium">{p.name}{p.company && <span className="text-muted"> · {p.company}</span>}</p>
                    <p className={`truncate text-[13px] ${rec.mode === "wait" ? "text-muted" : "font-medium text-accent"}`}>
                      {rec.mode === "wait" && rec.waitUntil ? fmt(t.gd.prospect.waitShort, { when: formatRelative(rec.waitUntil, locale) }) : label}
                    </p>
                  </div>
                  {rec.mode === "follow_up" && <Badge tone="warning">{t.cp.followUps.due}</Badge>}
                  <ArrowRight className="flip-rtl size-4 shrink-0 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-6 text-center">
            <p className="text-[14px] text-muted">{t.gd.home.actionsEmpty}</p>
          </div>
        )}
      </Card>

      <section>
        <h2 className="mb-3 text-[15px] font-semibold">{t.gd.home.winsTitle}</h2>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
          {wins.map(([label, n]) => (
            <li key={label} className={`rounded-2xl border p-3 ${n > 0 ? "border-success/30 bg-success-soft" : "border-line"}`}>
              <p className="tabular text-[20px] font-semibold leading-none">{n}</p>
              <p className="mt-1.5 text-[12px] leading-snug text-muted">{label}</p>
            </li>
          ))}
        </ul>
      </section>

      {beginner ? (
        <details className="group">
          <summary className="flex cursor-pointer select-none list-none items-center gap-2 text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
            {t.gd.home.numbers}<ChevronDown className="size-4 text-muted transition group-open:rotate-180" />
          </summary>
          <div className="mt-4 space-y-6">{numbers}</div>
        </details>
      ) : numbers}
    </div>
  );
}
