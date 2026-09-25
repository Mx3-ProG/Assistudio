import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { requireSession, isStaff } from "@/lib/auth";
import { repo } from "@/lib/data";
import { DashboardShell } from "@/components/dashboard/shell";

export const metadata: Metadata = { title: "Studio ATS", robots: { index: false, follow: false, nocache: true } };

export default async function DashboardLayout({ children, params }: LayoutProps<"/[locale]/dashboard">) {
  const { locale } = (await params) as { locale: Locale };
  const s = await requireSession(locale);
  if (!s.affiliate) redirect(`/${locale}/admin`);
  const [notifications, settings] = await Promise.all([repo().listNotifications(s), repo().getSettings()]);
  return (
    <DashboardShell
      userName={s.displayName || s.fullName}
      unread={notifications.filter((n) => !n.readAt).length}
      isStaff={isStaff(s)}
      leaderboard={settings.leaderboardEnabled}
    >
      {children}
    </DashboardShell>
  );
}
