import type { Locale } from "@/i18n/config";
import { requireSession } from "@/lib/auth";
import { NotificationsView } from "@/components/notifications/notifications-view";

export default async function Notifications({ params, searchParams }: PageProps<"/[locale]/dashboard/notifications">) {
  const { locale } = (await params) as { locale: Locale };
  const s = await requireSession(locale);
  return <NotificationsView locale={locale} s={s} tabParam={(await searchParams).tab} area="dashboard" />;
}
