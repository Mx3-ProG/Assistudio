import { ArrowLeft, ShieldCheck, CircleCheck, CircleAlert, CircleDashed } from "lucide-react";
import Link from "next/link";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { fmt } from "@/i18n/format";
import { requireAffiliate } from "@/lib/auth";
import { repo } from "@/lib/data";
import { refreshConnectStatus } from "@/lib/services/payouts";
import { log } from "@/lib/log";
import { formatRelative } from "@/lib/money";
import { startConnectOnboarding, openConnectDashboard } from "@/app/actions/payouts";
import { PageHeader, Card, Badge, Notice } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";

/**
 * Payout account (Stripe Connect). STUDIO never collects bank details: the
 * affiliate onboards on Stripe's hosted pages; we keep the account id and the
 * status that decides payout eligibility.
 */
export default async function PayoutSettings({ params, searchParams }: PageProps<"/[locale]/dashboard/payouts/settings">) {
  const { locale } = (await params) as { locale: Locale };
  const sp = await searchParams;
  const s = await requireAffiliate(locale);
  const t = await getDictionary(locale);
  const P = t.dash.payouts.settings;
  if (sp.returned && !s.isDemo) {
    await refreshConnectStatus(s).catch((e) => log.error("payouts", "connect status refresh failed", { error: e }));
  }
  const c = await repo().getConnectStatus(s);
  const Icon = c.onboardingStatus === "complete" ? CircleCheck : c.onboardingStatus === "restricted" ? CircleAlert : CircleDashed;
  const tone = c.onboardingStatus === "complete" ? "success" as const : c.onboardingStatus === "restricted" ? "danger" as const : "neutral" as const;
  const canConnect = c.enabled && c.providerConfigured && s.affiliate.status === "approved";

  return (
    <>
      <Link href={`/${locale}/dashboard/payouts`} className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-fg">
        <ArrowLeft className="flip-rtl size-3.5" />{t.dash.payouts.title}
      </Link>
      <PageHeader title={P.title} subtitle={P.subtitle} />
      {sp.returned && <div className="mb-4"><Notice>{P.returned}</Notice></div>}
      {sp.error && <div className="mb-4"><Notice tone="warning">{t.errors.generic}</Notice></div>}

      <Card className="p-5 sm:p-6">
        <h2 className="text-[15px] font-semibold">{P.connectTitle}</h2>
        <p className="mt-1 max-w-2xl text-[14px] text-fg-2">{P.connectBody}</p>

        <div className="mt-5 flex flex-col gap-4 rounded-2xl bg-surface-2 p-4 sm:flex-row sm:items-center">
          <Icon className={`size-5 shrink-0 ${tone === "success" ? "text-success" : tone === "danger" ? "text-danger" : "text-muted"}`} />
          <div className="flex-1">
            <p className="text-[14px] font-medium">{P.statusLabel}: <Badge tone={tone}>{P.statuses[c.onboardingStatus]}</Badge></p>
            <p className="mt-1 text-[12px] text-muted">
              {c.payoutsEnabled ? P.payoutsEnabled : P.payoutsDisabled}
              {c.requirementsStatus && c.requirementsStatus !== "none" && <> · {fmt(P.requirements, { status: c.requirementsStatus })}</>}
              {c.updatedAt && <> · {formatRelative(c.updatedAt, locale)}</>}
            </p>
          </div>
          {canConnect && (c.onboardingStatus === "complete" ? (
            <form action={openConnectDashboard}>
              <input type="hidden" name="locale" value={locale} />
              <button className={buttonClass("secondary", "md")}>{P.dashboard}</button>
            </form>
          ) : (
            <form action={startConnectOnboarding}>
              <input type="hidden" name="locale" value={locale} />
              <button className={buttonClass("primary", "md")}>{c.accountConnected ? P.resume : P.connect}</button>
            </form>
          ))}
        </div>
        {!c.enabled && <p className="mt-4 text-[13px] text-muted">{P.disabled}</p>}
        {c.enabled && !c.providerConfigured && <p className="mt-4 text-[13px] text-muted">{P.unavailable}</p>}
        <p className="mt-4 flex items-center gap-2 text-[12px] text-muted"><ShieldCheck className="size-3.5" />{t.dash.payouts.methodHint}</p>
      </Card>
      <div className="mt-6"><Notice>{t.dash.payouts.pipeline}</Notice></div>
    </>
  );
}
