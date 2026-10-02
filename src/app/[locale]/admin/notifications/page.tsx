import type { Locale } from "@/i18n/config";
import { requireStaff } from "@/lib/auth";
import { NotificationsView } from "@/components/notifications/notifications-view";

/** Staff notifications: new help requests (and anything addressed to the staff profile). */
export default async function AdminNotifications({ params, searchParams }: PageProps<"/[locale]/admin/notifications">) {
  const { locale } = (await params) as { locale: Locale };
  const s = await requireStaff(locale);
  return <NotificationsView locale={locale} s={s} tabParam={(await searchParams).tab} area="admin" />;
}
