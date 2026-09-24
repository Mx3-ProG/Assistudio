import Link from "next/link";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { requireStaff } from "@/lib/auth";
import { repo } from "@/lib/data";
import type { CommissionStatus } from "@/lib/commission";
import { formatDate, formatMoney } from "@/lib/money";
import { commissionAction, releaseDue } from "@/app/actions/admin";
import { PageHeader, Card, Badge, Notice } from "@/components/ui/primitives";
import { ReasonAction } from "@/components/admin/reason-action";
import { AdjustmentForm } from "@/components/admin/adjustment-form";
import { commissionTone } from "@/components/dashboard/status";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const FILTERS: (CommissionStatus | "all")[] = ["all", "pending", "disputed", "available", "paid", "reversed"];

/** Consult, filter, examine, validate, dispute, adjust — every change audited with a reason. */
export default async function AdminCommissions({ params, searchParams }: PageProps<"/[locale]/admin/commissions">) {
  const { locale } = (await params) as { locale: Locale };
  const sp = await searchParams;
  const s = await requireStaff(locale);
  const t = await getDictionary(locale);
  const status = FILTERS.find((f) => f === sp.status) ?? "all";
  const affiliateFilter = typeof sp.affiliate === "string" ? sp.affiliate : null;
  const [all, options] = await Promise.all([repo().adminListCommissions(s), repo().adminFinanceOptions(s)]);
  const rows = all.filter((c) => (status === "all" || c.status === status) && (!affiliateFilter || c.affiliateId === affiliateFilter));
  const C = t.dash.commissions;
  const A = t.admin;
  const base = `/${locale}/admin/commissions`;

  return (
    <>
      <PageHeader
        title={A.nav.commissions}
        subtitle={A.commissionsHint}
        action={<form action={releaseDue}><button className={buttonClass("secondary", "md")}>Release due (validation elapsed)</button></form>}
      />
      <nav className="mb-4 flex gap-1 overflow-x-auto">
        {FILTERS.map((f) => (
          <Link key={f} href={f === "all" ? base : `${base}?status=${f}`}
            className={cn("whitespace-nowrap rounded-full px-4 py-1.5 text-[13px] font-medium", status === f ? "bg-fg text-bg" : "text-muted hover:bg-surface-2")}>
            {f === "all" ? t.common.all : C.statuses[f]} · {all.filter((c) => f === "all" || c.status === f).length}
          </Link>
        ))}
      </nav>
      <Card className="overflow-hidden">
        <ul className="divide-y divide-line">
          {rows.map((c) => (
            <li key={c.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:px-6">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-medium">
                  {c.saleRef} · <Link href={`${base}?affiliate=${c.affiliateId}`} className="hover:underline">{c.affiliateName}</Link>
                  {c.kind === "renewal" && <Badge tone="neutral">{C.kinds.renewal}</Badge>}
                  <Badge tone={commissionTone[c.status]}>{C.statuses[c.status]}</Badge>
                  {c.recoveryStatus && <Badge tone={c.recoveryStatus === "required" ? "danger" : "neutral"}>{A.recovery[c.recoveryStatus]}</Badge>}
                </p>
                <p className="text-[12px] text-muted">
                  {C.gross}: {formatMoney(c.grossCents, locale, c.currency)} · {C.validationDate}: {formatDate(c.holdUntil, locale, "short")} · {C.paymentDate}: {formatDate(c.paidAt, locale, "short")}
                  {c.disputeReason && ` · ${c.disputeReason}`}
                  {c.reversalReason && ` · ${c.reversalReason}`}
                </p>
              </div>
              <span className="tabular font-semibold">{formatMoney(c.amountCents, locale, c.currency)}</span>
              <div className="flex flex-wrap gap-2">
                {c.status === "pending" && <ReasonAction action={commissionAction} fields={{ id: c.id, op: "validate" }} label={A.validate} variant="primary" />}
                {["awaiting_payment", "pending", "available"].includes(c.status) && <ReasonAction action={commissionAction} fields={{ id: c.id, op: "dispute" }} label={A.dispute} />}
                {c.status === "disputed" && <ReasonAction action={commissionAction} fields={{ id: c.id, op: "undispute" }} label={A.undispute} variant="primary" />}
                {c.status !== "reversed" && <ReasonAction action={commissionAction} fields={{ id: c.id, op: "reverse" }} label={A.reverse} variant="danger" />}
              </div>
            </li>
          ))}
        </ul>
      </Card>
      <Card className="mt-6 p-5 sm:p-6">
        <h2 className="text-[15px] font-semibold">{A.adjust}</h2>
        <p className="mb-4 mt-1 text-[13px] text-muted">{A.adjustHint}</p>
        <AdjustmentForm affiliates={options.affiliates} />
      </Card>
      <div className="mt-6"><Notice>{C.explainer}</Notice></div>
    </>
  );
}
