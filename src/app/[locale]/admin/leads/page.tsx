import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { requireStaff } from "@/lib/auth";
import { repo } from "@/lib/data";
import { formatDate } from "@/lib/money";
import { createSaleFromLead } from "@/app/actions/admin";
import { PageHeader, Card, Badge, Notice } from "@/components/ui/primitives";
import { ReasonAction } from "@/components/admin/reason-action";

/** Inbound "Request STUDIO" leads, with their attribution. Staff convert won leads into sales. */
export default async function AdminLeads({ params }: PageProps<"/[locale]/admin/leads">) {
  const { locale } = (await params) as { locale: Locale };
  const s = await requireStaff(locale);
  const t = await getDictionary(locale);
  const leads = await repo().adminListLeads(s);
  return (
    <>
      <PageHeader title={t.admin.nav.leads} />
      <div className="mb-4"><Notice>{t.admin.leadsHint}</Notice></div>
      <Card className="overflow-hidden">
        <ul className="divide-y divide-line">
          {leads.length === 0 && <li className="p-10 text-center text-muted">{t.common.empty}</li>}
          {leads.map((l) => (
            <li key={l.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:px-6">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-medium">
                  {l.fullName}{l.company && <span className="text-muted">· {l.company}</span>}
                  <Badge tone={l.status === "converted" ? "success" : l.status === "new" ? "accent" : "neutral"}>{l.status.replace(/_/g, " ")}</Badge>
                </p>
                <p className="text-[12px] text-muted">{l.email} · {l.profession ?? "—"} · {formatDate(l.createdAt, locale, "short")}</p>
              </div>
              <span className="text-[13px] text-fg-2">{l.affiliateName ?? t.admin.unattributed}</span>
              {l.status !== "converted" && (
                <ReasonAction action={createSaleFromLead} fields={{ id: l.id }} label={t.admin.convertToSale} variant="primary" />
              )}
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
