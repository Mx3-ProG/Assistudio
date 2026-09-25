import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";
import { requireStaff } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = { title: "Studio ATS Admin", robots: { index: false, follow: false, nocache: true } };

export default async function AdminLayout({ children, params }: LayoutProps<"/[locale]/admin">) {
  const { locale } = (await params) as { locale: Locale };
  const s = await requireStaff(locale);
  return <AdminShell hasAffiliate={!!s.affiliate}>{children}</AdminShell>;
}
