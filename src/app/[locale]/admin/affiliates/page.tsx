import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { requireStaff } from "@/lib/auth";
import { repo } from "@/lib/data";
import { formatDate, formatMoney } from "@/lib/money";
import { setAffiliateStatus } from "@/app/actions/admin";
import { PageHeader, Card, Badge } from "@/components/ui/primitives";
import { ReasonAction } from "@/components/admin/reason-action";
import { MessageMemberButton } from "@/components/messaging/conversation-sidebar";

const tone = { pending: "warning", approved: "success", rejected: "neutral", suspended: "danger" } as const;

export default async function Affiliates({ params }: PageProps<"/[locale]/admin/affiliates">) {
  const { locale } = (await params) as { locale: Locale };
  const s = await requireStaff(locale);
  const t = await getDictionary(locale);
  const rows = await repo().adminListAffiliates(s);
  const A = t.admin;
  return (
    <>
      <PageHeader title={A.nav.affiliates} />
      <Card className="overflow-hidden">
        <ul className="divide-y divide-line">
          {rows.map((a) => (
            <li key={a.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:px-6">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-medium">{a.name} <Badge tone={tone[a.status]}>{A.affiliateStatuses[a.status]}</Badge></p>
                <p className="text-[12px] text-muted">{a.email} · {a.code} · {a.country ?? "—"} · {formatDate(a.createdAt, locale, "short")}</p>
                {a.status === "pending" && Object.keys(a.application).length > 0 && (
                  <p className="mt-1 text-[12px] text-fg-2">{Object.entries(a.application).map(([k, v]) => `${k}: ${String(v)}`).join(" · ")}</p>
                )}
              </div>
              <div className="flex items-center gap-4 text-[13px]">
                <span className="tabular text-muted">{a.sales} sales</span>
                <span className="tabular font-medium">{formatMoney(a.availableCents, locale)}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <MessageMemberButton profileId={a.profileId} base={`/${locale}/admin/messages`} />
                {a.status !== "approved" && <ReasonAction action={setAffiliateStatus} fields={{ id: a.id, status: "approved" }} label={a.status === "suspended" ? A.reinstate : A.approve} variant="primary" />}
                {a.status === "pending" && <ReasonAction action={setAffiliateStatus} fields={{ id: a.id, status: "rejected" }} label={A.reject} />}
                {a.status === "approved" && <ReasonAction action={setAffiliateStatus} fields={{ id: a.id, status: "suspended" }} label={A.suspend} variant="danger" />}
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
