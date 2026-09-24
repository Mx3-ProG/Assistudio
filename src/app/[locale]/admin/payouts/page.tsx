import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { requireStaff } from "@/lib/auth";
import { repo } from "@/lib/data";
import { formatDate, formatMoney } from "@/lib/money";
import { createPayout, markPayoutPaid } from "@/app/actions/admin";
import { PageHeader, Card, CardHeader, Badge, Notice } from "@/components/ui/primitives";
import { ReasonAction } from "@/components/admin/reason-action";
import { payoutTone } from "@/components/dashboard/status";
import { PayoutCreate } from "@/components/admin/payout-create";

export default async function AdminPayouts({ params }: PageProps<"/[locale]/admin/payouts">) {
  const { locale } = (await params) as { locale: Locale };
  const s = await requireStaff(locale);
  const t = await getDictionary(locale);
  const [candidates, payouts] = await Promise.all([repo().adminPayoutCandidates(s), repo().adminListPayouts(s)]);
  const P = t.dash.payouts;
  return (
    <>
      <PageHeader title={t.admin.nav.payouts} />
      <div className="mb-6"><Notice>Payouts are executed through a regulated payment provider (integration pending). Marking a payout as paid requires the provider reference and is audit-logged.</Notice></div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title={P.available} />
          <ul className="mt-3 divide-y divide-line">
            {candidates.length === 0 && <li className="px-6 py-8 text-center text-[14px] text-muted">{t.common.empty}</li>}
            {candidates.map((c) => (
              <li key={c.affiliateId} className="flex items-center justify-between gap-3 px-5 py-3 sm:px-6">
                <span className="font-medium">{c.affiliateName}</span>
                <span className="tabular">{formatMoney(c.availableCents, locale)}</span>
                <PayoutCreate action={createPayout} affiliateId={c.affiliateId} label={t.admin.createPayout} />
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title={P.history} />
          <ul className="mt-3 divide-y divide-line">
            {payouts.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 px-5 py-3 sm:px-6">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{p.ref} · {p.affiliateName}</p>
                  <p className="text-[12px] text-muted">{formatDate(p.paidAt ?? p.scheduledFor, locale, "short")}</p>
                </div>
                <Badge tone={payoutTone[p.status]}>{P.statuses[p.status]}</Badge>
                <span className="tabular font-semibold">{formatMoney(p.amountCents, locale)}</span>
                {(p.status === "scheduled" || p.status === "processing") && (
                  <ReasonAction action={markPayoutPaid} fields={{ id: p.id }} label={t.admin.markPaid} variant="primary" input={{ name: "providerRef", placeholder: "Provider reference" }} />
                )}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
