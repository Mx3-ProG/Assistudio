import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";
import { requireStaff } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";
import { repo } from "@/lib/data";
import { isDemoMode } from "@/lib/env";

export const metadata: Metadata = { title: "Studio ATS Admin", robots: { index: false, follow: false, nocache: true } };

export default async function AdminLayout({ children, params }: LayoutProps<"/[locale]/admin">) {
  const { locale } = (await params) as { locale: Locale };
  const s = await requireStaff(locale);
  const [inbox, own, help] = await Promise.all([
    repo().listSupportInbox(s).catch(() => []), repo().getUnreadMessageCount(s).catch(() => 0),
    repo().adminListHelpRequests(s, { status: ["open"] }).catch(() => []),
  ]);
  const unread = inbox.reduce((a, r) => a + r.unread, 0) + own;
  return (
    <AdminShell hasAffiliate={!!s.affiliate} openHelp={help.length} messages={{ unread, me: s.userId, realtime: !isDemoMode }}>
      {children}
    </AdminShell>
  );
}
