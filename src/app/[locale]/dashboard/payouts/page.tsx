import Link from "next/link";
import { Banknote, CreditCard, FileText, ShieldCheck } from "lucide-react";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { fmt } from "@/i18n/format";
import { requireAffiliate } from "@/lib/auth";
import { repo } from "@/lib/data";
import { formatDate, formatMoney } from "@/lib/money";
import { PageHeader, Card, Stat, Badge, EmptyState, Notice } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";
import { payoutTone } from "@/components/dashboard/status";

/**
 * Question: "When do I get paid?"
 * Payouts are a deliberate staff action after the validation period — never
 * automatic. The payout account lives at Stripe (Connect); no bank details
 * are ever stored by STUDIO.
 */
export default async function Payouts({ params }: PageProps<"/[locale]/dashboard/payouts">) {
  const { locale } = (await params) as { locale: Locale };
  const s = await requireAffiliate(locale);
  const t = await getDictionary(locale);
  const [b, payouts, settings, connect] = await Promise.all([
    repo().getBalances(s), repo().listPayouts(s), repo().getSettings(), repo().getConnectStatus(s),
  ]);
  const P = t.dash.payouts;
  const next = payouts.find((p) => p.status === "scheduled" || p.status === "processing");

  return (
    <>
      <PageHeader title={P.title} subtitle={P.subtitle} />
      <section className="grid gap-3 sm:grid-cols-2">
        <Stat label={P.available} value={formatMoney(b.availableCents, locale)} tone="accent" hint={fmt(P.minimum, { amount: formatMoney(settings.payoutMinimumCents, locale) })} />
        <Stat label={P.next} value={next ? formatDate(next.scheduledFor, locale) : "—"} hint={next ? formatMoney(next.amountCents, locale) : undefined} />
      </section>

      <div className="mt-6"><Notice>{P.pipeline}</Notice></div>
      <Card className="mt-6 p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold"><CreditCard className="size-4 text-accent" />{P.method}</h2>
        <div className="mt-4 flex flex-col gap-4 rounded-2xl bg-surface-2 p-4 sm:flex-row sm:items-center">
          <p className="flex-1 text-[14px]">{connect.accountConnected ? P.settings.statuses[connect.onboardingStatus] : P.methodNone}</p>
          <Link href={`/${locale}/dashboard/payouts/settings`} className={buttonClass("secondary", "md")}>{P.settingsLink}</Link>
        </div>
        <p className="mt-3 flex items-center gap-2 text-[12px] text-muted"><ShieldCheck className="size-3.5" />{P.methodHint}</p>
      </Card>

      <Card className="mt-6 overflow-hidden">
        <h2 className="px-5 pt-5 text-[15px] font-semibold sm:px-6">{P.history}</h2>
        {payouts.length === 0 ? <EmptyState icon={<Banknote className="size-5" />} title={P.empty} /> : (
          <ul className="mt-3 divide-y divide-line">
            {payouts.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-5 py-3.5 sm:px-6">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{p.ref}</p>
                  <p className="text-[12px] text-muted">{formatDate(p.paidAt ?? p.scheduledFor, locale)}</p>
                </div>
                <Badge tone={payoutTone[p.status]}>{P.statuses[p.status]}</Badge>
                <p className="tabular w-24 text-end font-semibold">{formatMoney(p.amountCents, locale)}</p>
                <span className="grid size-8 place-items-center text-muted" title={P.documents}>
                  {p.documentPath ? <a href={p.documentPath}><FileText className="size-4" /></a> : <FileText className="size-4 opacity-30" />}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
