import Link from "next/link";
import { ArrowRight, CalendarClock, Sparkles, Clock } from "lucide-react";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { fmt } from "@/i18n/format";
import { requireAffiliate } from "@/lib/auth";
import { repo } from "@/lib/data";
import { formatMoney, formatNumber, formatRelative } from "@/lib/money";
import { computeCommissionCents } from "@/lib/commission";
import { Card, CardHeader, Notice } from "@/components/ui/primitives";
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
  const [o, offer] = await Promise.all([repo().getOverview(s, "all"), repo().getOffer()]);
  const b = o.balances;
  const first = (s.displayName || s.fullName).split(" ")[0];
  const base = `/${locale}/dashboard`;

  const kpis = [
    { value: formatMoney(b.lifetimeEarnedCents, locale), label: t.dash.kpi.earned, hint: t.dash.kpi.earnedHint, tone: "text-success", href: `${base}/commissions` },
    { value: formatMoney(b.pendingPaymentCents + b.inValidationCents, locale), label: t.dash.kpi.pending, hint: t.dash.kpi.pendingHint, tone: "text-warning", href: `${base}/commissions` },
    { value: formatMoney(b.paidCents, locale), label: t.dash.kpi.paid, href: `${base}/payouts` },
    { value: formatNumber(o.activeClients, locale), label: t.dash.kpi.activeClients, href: `${base}/recurring` },
    { value: formatNumber(o.opportunities, locale), label: t.dash.kpi.opportunities, href: `${base}/prospects` },
    { value: formatNumber(o.clicks, locale), label: t.dash.kpi.clicks, href: `${base}/link` },
  ];

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

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k, i) => (
          <Link key={k.label} href={k.href} className="card group p-4 transition hover:-translate-y-0.5 hover:shadow-md sm:p-5" style={{ animationDelay: `${i * 40}ms` }}>
            <div className={`tabular text-[22px] font-semibold leading-none tracking-[-0.03em] sm:text-[26px] ${k.tone ?? ""}`}>{k.value}</div>
            <div className="mt-2 text-[13px] text-muted">{k.label}</div>
          </Link>
        ))}
      </section>

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
