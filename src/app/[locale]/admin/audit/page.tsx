import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { requireStaff } from "@/lib/auth";
import { repo } from "@/lib/data";
import { formatDate } from "@/lib/money";
import { PageHeader, Card } from "@/components/ui/primitives";

export default async function Audit({ params }: PageProps<"/[locale]/admin/audit">) {
  const { locale } = (await params) as { locale: Locale };
  const s = await requireStaff(locale);
  const t = await getDictionary(locale);
  const logs = await repo().adminListAuditLogs(s);
  const A = t.admin;
  return (
    <>
      <PageHeader title={A.nav.audit} subtitle={A.auditSubtitle} />
      <Card className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="text-[12px] text-muted"><tr className="border-b border-line">
            {[A.when, A.actor, A.action, A.entity, A.reason.split(" (")[0], "Before → After"].map((h) => <th key={h} className="whitespace-nowrap px-4 py-3 text-start font-medium">{h}</th>)}
          </tr></thead>
          <tbody className="divide-y divide-line">
            {logs.map((l) => (
              <tr key={l.id} className="align-top">
                <td className="whitespace-nowrap px-4 py-3 text-fg-2">{formatDate(l.createdAt, locale, "short")}</td>
                <td className="px-4 py-3">{l.actor}</td>
                <td className="px-4 py-3 font-mono">{l.action}</td>
                <td className="px-4 py-3 text-fg-2">{l.entity}:{l.entityId}</td>
                <td className="px-4 py-3">{l.reason ?? "—"}</td>
                <td className="max-w-md px-4 py-3 font-mono text-[11px] text-muted">{JSON.stringify(l.before)} → {JSON.stringify(l.after)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
