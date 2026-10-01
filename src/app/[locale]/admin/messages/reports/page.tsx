import type { Locale } from "@/i18n/config";
import { requireStaff } from "@/lib/auth";
import { repo } from "@/lib/data";
import { ReportsPanel } from "@/components/messaging/reports-panel";

export default async function MessageReportsPage({ params }: PageProps<"/[locale]/admin/messages/reports">) {
  const { locale } = (await params) as { locale: Locale };
  const s = await requireStaff(locale);
  const reports = await repo().listMessageReports(s);
  // eslint-disable-next-line react-hooks/purity -- request-time snapshot so relative times hydrate identically
  const now = Date.now();
  return <ReportsPanel reports={reports} now={now} backHref={`/${locale}/admin/messages`} />;
}
