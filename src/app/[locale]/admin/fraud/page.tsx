import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { requireStaff } from "@/lib/auth";
import { repo } from "@/lib/data";
import { formatRelative } from "@/lib/money";
import { reviewFraud } from "@/app/actions/admin";
import { PageHeader, Card, Badge, Notice } from "@/components/ui/primitives";
import { ReasonAction } from "@/components/admin/reason-action";

const tone = { open: "warning", reviewing: "accent", dismissed: "neutral", confirmed: "danger" } as const;

export default async function Fraud({ params }: PageProps<"/[locale]/admin/fraud">) {
  const { locale } = (await params) as { locale: Locale };
  const s = await requireStaff(locale);
  const t = await getDictionary(locale);
  const flags = await repo().adminListFraudFlags(s);
  const A = t.admin;
  return (
    <>
      <PageHeader title={A.nav.fraud} />
      <div className="mb-6"><Notice tone="warning">{A.fraudPrinciple}</Notice></div>
      <Card className="overflow-hidden">
        <ul className="divide-y divide-line">
          {flags.length === 0 && <li className="p-10 text-center text-muted">{t.common.empty}</li>}
          {flags.map((f) => (
            <li key={f.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:px-6">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-medium capitalize">
                  {f.type.replace(/_/g, " ")}
                  <Badge tone={f.severity >= 2 ? "danger" : "warning"}>S{f.severity}</Badge>
                  <Badge tone={tone[f.status]}>{f.status}</Badge>
                </p>
                <p className="text-[12px] text-muted">{f.affiliateName ?? "—"} · {f.entity}:{f.entityId} · {formatRelative(f.createdAt, locale)}</p>
                <p className="mt-1 font-mono text-[11px] text-muted">{A.signals}: {JSON.stringify(f.signals)}</p>
                {f.decisionNote && <p className="mt-1 text-[12px] text-fg-2">→ {f.decisionNote}</p>}
              </div>
              {(f.status === "open" || f.status === "reviewing") && (
                <div className="flex flex-wrap gap-2">
                  {f.status === "open" && <ReasonAction action={reviewFraud} fields={{ id: f.id, status: "reviewing" }} label={A.review} />}
                  <ReasonAction action={reviewFraud} fields={{ id: f.id, status: "dismissed" }} label={A.dismiss} />
                  <ReasonAction action={reviewFraud} fields={{ id: f.id, status: "confirmed" }} label={A.confirm} variant="danger" />
                </div>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
