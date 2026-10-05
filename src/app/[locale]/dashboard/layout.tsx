import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { requireSession, isStaff } from "@/lib/auth";
import { repo } from "@/lib/data";
import { getBadges, staffOpenHelp } from "@/lib/badges";
import { DashboardShell } from "@/components/dashboard/shell";
import { isDemoMode } from "@/lib/env";

export const metadata: Metadata = { title: "Studio ATS", robots: { index: false, follow: false, nocache: true } };

export default async function DashboardLayout({ children, params }: LayoutProps<"/[locale]/dashboard">) {
  const { locale } = (await params) as { locale: Locale };
  const s = await requireSession(locale);
  if (!s.affiliate) redirect(`/${locale}/admin`);
  const [b, settings, staffHelp] = await Promise.all([getBadges(s, "dashboard"), repo().getSettings(), staffOpenHelp(s)]);
  return (
    <DashboardShell
      userId={s.userId}
      userName={s.displayName || s.fullName}
      unread={b.notifications}
      help={b.help}
      staffHelp={staffHelp}
      isStaff={isStaff(s)}
      leaderboard={settings.leaderboardEnabled}
      messages={{ unread: b.messages, me: s.userId, realtime: !isDemoMode }}
    >
      {children}
    </DashboardShell>
  );
}
