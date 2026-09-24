import Link from "next/link";
import { ArrowRight, CalendarClock, Sparkles, Clock, Hourglass, BadgeCheck } from "lucide-react";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { fmt } from "@/i18n/format";
import { requireAffiliate } from "@/lib/auth";
import { repo } from "@/lib/data";
import { formatMoney, formatNumber, formatRelative } from "@/lib/money";
import { computeCommissionCents } from "@/lib/commission";
import { Card, CardHeader, Notice, Badge } from "@/components/ui/primitives";
import { LiveSales } from "@/components/dashboard/live-sales";
import { LinkButton } from "@/components/ui/button";
import { EarningsChart } from "@/components/dashboard/earnings-chart";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { GoalCard } from "@/components/dashboard/goal-card";

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
  const [o, offer, fin] = await Promise.all([repo().getOverview(s, "all"), repo().getOffer(), repo().getFinancialOverview(s)]);
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

  return (
    <div className="space-y-6">
      <header className="animate-rise">
        <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.035em] sm:text-[40px]">{greeting(t, first)}</h1>
        <p className="mt-1 text-[15px] text-muted">{t.dash.overviewSubtitle}</p>
      </header>

      {!s.affiliate.onboardingCompletedAt && (
        <Link href={`${base}/welcome`} className="card flex items-center gap-4 border-accent/30 bg-accent-soft p-4 transition hover:shadow-md">
          <Sparkles className="size-5 shrink-0 text-accent" />
          <span className="flex-1 text-[14px] font-medium">{t.dash.onboarding.resume}</span>
          <ArrowRight className="flip-rtl size-4 text-accent" />
        </Link>
      )}
      {s.affiliate.status === "pending" && <Notice tone="warning">{t.dash.onboarding.pendingNote}</Notice>}

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
      <LiveSales affiliateId={s.affiliate.id} locale={locale} text={t.dash.live} enabled={!s.isDemo} />

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="min-w-0 space-y-6">
          <EarningsChart points={o.earnings} />
          <Card>
            <CardHeader
              title={<span className="flex items-center gap-2"><CalendarClock className="size-4 text-accent" />{t.dash.nextActionsTitle}</span>}
              action={<Link href={`${base}/prospects`} className="text-[13px] text-accent hover:underline">{t.common.viewAll}</Link>}
            />
            {o.nextActions.length ? (
              <ul className="mt-3 divide-y divide-line">
                {o.nextActions.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 px-5 py-3 sm:px-6">
                    <div className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-2 text-[13px] font-semibold">{p.name[0]}</div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium">{p.name}{p.company && <span className="text-muted"> · {p.company}</span>}</p>
                      <p className="truncate text-[12px] text-muted">{p.nextAction}</p>
                    </div>
                    <span className="flex shrink-0 items-center gap-1 text-[12px] text-muted"><Clock className="size-3" />{formatRelative(p.nextActionAt!, locale)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-6 text-center">
                <p className="text-[14px] text-muted">{t.dash.nextActionsEmpty}</p>
                <LinkButton href={`${base}/prospects`} size="sm" variant="secondary" className="mt-4">{t.dash.prospects.new}</LinkButton>
              </div>
            )}
          </Card>
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
    </div>
  );
}
