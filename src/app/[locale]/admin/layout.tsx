import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";
import { requireStaff } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";
import { getBadges } from "@/lib/badges";
import { isDemoMode } from "@/lib/env";

export const metadata: Metadata = { title: "Studio ATS Admin", robots: { index: false, follow: false, nocache: true } };

export default async function AdminLayout({ children, params }: LayoutProps<"/[locale]/admin">) {
  const { locale } = (await params) as { locale: Locale };
  const s = await requireStaff(locale);
  const b = await getBadges(s, "admin");
  return (
    <AdminShell hasAffiliate={!!s.affiliate} openHelp={b.help} notifications={b.notifications} messages={{ unread: b.messages, me: s.userId, realtime: !isDemoMode }}>
      {children}
    </AdminShell>
  );
}
