import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, Info } from "lucide-react";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { fmt } from "@/i18n/format";
import { requireStaff } from "@/lib/auth";
import { repo } from "@/lib/data";
import { formatDate, formatMoney } from "@/lib/money";
import { Badge, Card } from "@/components/ui/primitives";
import { BackLink } from "@/components/sales-center/back-link";
import { payoutTone, commissionTone } from "@/components/dashboard/status";
import { PayoutActions } from "@/components/admin/payout-actions";
import { cn } from "@/lib/cn";

/** One payout: who, how much, which commissions, what happened — and the next action. */
export default async function AdminPayout({ params }: PageProps<"/[locale]/admin/payouts/[id]">) {
  const { locale, id } = (await params) as { locale: Locale; id: string };
  const s = await requireStaff(locale);
  const p = await repo().adminGetPayout(s, id);
  if (!p) notFound();
  const t = await getDictionary(locale);
  const A = t.po.admin;
  const money = (c: number) => formatMoney(c, locale, "EUR");
  const facts: [string, React.ReactNode][] = [
    [A.partner, <Link key="p" href={`/${locale}/admin/network/${p.affiliateId}`} className="font-medium text-accent hover:underline">{p.affiliateName}</Link>],
    ["Email", p.affiliateEmail ?? "—"],
    [A.requestedAt, formatDate(p.requestedAt, locale)],
    [A.balanceBefore, p.balanceBeforeCents != null ? money(p.balanceBeforeCents) : "—"],
    [A.method, A.methods[p.method]],
    [A.paymentRef, p.paymentReference ?? "—"],
  ];

  return (
    <div className="space-y-6">
      <div>
        <BackLink href={`/${locale}/admin/payouts`} label={A.back} />
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="tabular text-[13px] font-semibold text-muted">{p.ref}</p>
            <h1 className="tabular text-[34px] font-semibold leading-tight tracking-[-0.03em] sm:text-[42px]">{money(p.amountCents)}</h1>
          </div>
          <Badge tone={payoutTone[p.status]}>{t.po.statuses[p.status]}</Badge>
        </div>
      </div>

      {p.problem && (
        <p role="alert" className="flex gap-3 rounded-2xl bg-danger-soft p-4 text-[14px] text-danger">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden />{fmt(A.problem, { problem: p.problem })}
        </p>
      )}
      {p.rejectionReason && (p.status === "rejected" || p.status === "failed") && (
        <p className="rounded-2xl bg-surface-2 p-4 text-[14px]">{fmt(t.po.requests.reason, { reason: p.rejectionReason })}</p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {facts.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[12px] text-muted">{k}</dt>
                  <dd className="mt-0.5 break-words text-[14.5px]">{v}</dd>
                </div>
              ))}
            </dl>
            {p.adminNote && <p className="mt-4 rounded-xl bg-surface-2 p-3 text-[13px] text-fg-2">{p.adminNote}</p>}
          </Card>

          <Card className="overflow-hidden">
            <h2 className="px-5 pt-5 text-[15px] font-semibold sm:px-6">{A.commissions}</h2>
            <ul className="mt-3 divide-y divide-line">
              {p.allocations.map((a) => (
                <li key={a.commissionId} className={cn("flex items-center gap-3 px-5 py-3 sm:px-6", a.released && "opacity-50")}>
                  <div className="min-w-0 flex-1">
                    <p className="tabular font-medium">{A.sale} {a.saleRef} <span className="text-muted">· {a.customerRef}</span></p>
                    <p className="text-[12px] text-muted">{A.commission} {money(a.commissionCents)}{a.released ? ` · ${A.released}` : ""}</p>
                  </div>
                  <Badge tone={commissionTone[a.status]}>{t.dash.commissions.statuses[a.status]}</Badge>
                  <p className="tabular w-24 text-end font-semibold">{money(a.amountCents)}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <h2 className="text-[15px] font-semibold">{A.actions}</h2>
            <p className="mt-2 flex gap-2 text-[13px] text-muted">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
              {p.method === "stripe_connect" ? fmt(A.stripeNote, { account: p.stripeAccountId ?? "—" }) : A.manualNote}
            </p>
            <div className="mt-4">
              <PayoutActions id={p.id} status={p.status} amountLabel={money(p.amountCents)} partnerName={p.affiliateName} problem={!!p.problem} />
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="text-[15px] font-semibold">{A.history}</h2>
            <ol className="mt-3 space-y-3">
              {p.events.map((e, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-accent" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-[14px]">
                      {e.from ? `${t.po.statuses[e.from]} → ` : ""}<strong>{t.po.statuses[e.to]}</strong> · <span className="tabular">{money(e.amountCents)}</span>
                    </p>
                    <p className="text-[12px] text-muted">
                      {formatDate(e.at, locale, "short")} {new Date(e.at).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })} · {e.actorName ? fmt(A.by, { name: e.actorName }) : A.system}
                    </p>
                    {e.note && <p className="mt-0.5 text-[12.5px] text-fg-2">{e.note}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}
