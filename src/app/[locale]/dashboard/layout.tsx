import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { requireSession, isStaff } from "@/lib/auth";
import { repo } from "@/lib/data";
import { DashboardShell } from "@/components/dashboard/shell";
import { isDemoMode } from "@/lib/env";

export const metadata: Metadata = { title: "Studio ATS", robots: { index: false, follow: false, nocache: true } };

export default async function DashboardLayout({ children, params }: LayoutProps<"/[locale]/dashboard">) {
  const { locale } = (await params) as { locale: Locale };
  const s = await requireSession(locale);
  if (!s.affiliate) redirect(`/${locale}/admin`);
  const [notifications, settings, unreadMessages] = await Promise.all([
    repo().listNotifications(s), repo().getSettings(), repo().getUnreadMessageCount(s).catch(() => 0),
  ]);
  return (
    <DashboardShell
      userName={s.displayName || s.fullName}
      unread={notifications.filter((n) => !n.readAt).length}
      isStaff={isStaff(s)}
      leaderboard={settings.leaderboardEnabled}
      messages={{ unread: unreadMessages, me: s.userId, realtime: !isDemoMode }}
    >
      {children}
    </DashboardShell>
  );
}
