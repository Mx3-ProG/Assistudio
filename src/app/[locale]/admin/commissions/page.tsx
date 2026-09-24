import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { requireStaff } from "@/lib/auth";
import { repo } from "@/lib/data";
import { formatDate, formatMoney } from "@/lib/money";
import { commissionAction, releaseDue } from "@/app/actions/admin";
import { PageHeader, Card, Badge } from "@/components/ui/primitives";
import { ReasonAction } from "@/components/admin/reason-action";
import { commissionTone } from "@/components/dashboard/status";
import { buttonClass } from "@/components/ui/button";

export default async function AdminCommissions({ params }: PageProps<"/[locale]/admin/commissions">) {
  const { locale } = (await params) as { locale: Locale };
  const s = await requireStaff(locale);
  const t = await getDictionary(locale);
  const rows = await repo().adminListCommissions(s);
  const C = t.dash.commissions;
  const A = t.admin;
  return (
    <>
      <PageHeader
        title={A.nav.commissions}
        subtitle={C.explainer}
        action={<form action={releaseDue}><button className={buttonClass("secondary", "md")}>Release due (validation elapsed)</button></form>}
      />
      <Card className="overflow-hidden">
        <ul className="divide-y divide-line">
          {rows.map((c) => (
            <li key={c.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:px-6">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-medium">
                  {c.saleRef} · {c.affiliateName}
                  <Badge tone={commissionTone[c.status]}>{C.statuses[c.status]}</Badge>
                </p>
                <p className="text-[12px] text-muted">
                  {C.validationDate}: {formatDate(c.holdUntil, locale, "short")} · {C.paymentDate}: {formatDate(c.paidAt, locale, "short")}
                  {c.reversalReason && ` · ${c.reversalReason}`}
                </p>
              </div>
              <span className="tabular font-semibold">{formatMoney(c.amountCents, locale)}</span>
              <div className="flex flex-wrap gap-2">
                {["pending", "in_validation", "available"].includes(c.status) && <ReasonAction action={commissionAction} fields={{ id: c.id, op: "hold" }} label={A.hold} />}
                {c.status === "on_hold" && <ReasonAction action={commissionAction} fields={{ id: c.id, op: "unhold" }} label={A.release} variant="primary" />}
                {c.status !== "reversed" && <ReasonAction action={commissionAction} fields={{ id: c.id, op: "reverse" }} label={A.reverse} variant="danger" />}
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
