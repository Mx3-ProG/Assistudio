import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { requireStaff } from "@/lib/auth";
import { repo } from "@/lib/data";
import { PageHeader, Card, Notice } from "@/components/ui/primitives";
import { SettingsForm } from "@/components/admin/settings-form";
import { EmailTest } from "@/components/admin/email-test";
import { transportKind } from "@/lib/email";
import { env } from "@/lib/env";

export default async function AdminSettings({ params }: PageProps<"/[locale]/admin/settings">) {
  const { locale } = (await params) as { locale: Locale };
  const s = await requireStaff(locale);
  const t = await getDictionary(locale);
  const settings = await repo().getSettings();
  return (
    <>
      <PageHeader title={t.admin.nav.settings} subtitle={t.admin.settingsHint} />
      <Card className="max-w-2xl p-5 sm:p-6">
        <SettingsForm settings={settings} canEdit={s.role === "super_admin"} />
      </Card>
      <Card className="mt-4 max-w-2xl p-5 sm:p-6">
        <EmailTest from={env.emailFrom} transport={transportKind} />
      </Card>
      {s.role !== "super_admin" && <div className="mt-4 max-w-2xl"><Notice>Only a Super Admin can change business rules.</Notice></div>}
    </>
  );
}
