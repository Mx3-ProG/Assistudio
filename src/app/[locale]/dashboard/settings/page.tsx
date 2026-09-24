import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { requireSession } from "@/lib/auth";
import { PageHeader, Card } from "@/components/ui/primitives";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { ProfileForm, PrivacyActions } from "@/components/dashboard/settings-forms";

export default async function Settings({ params }: PageProps<"/[locale]/dashboard/settings">) {
  const { locale } = (await params) as { locale: Locale };
  const s = await requireSession(locale);
  const t = await getDictionary(locale);
  const S = t.dash.settings;
  return (
    <>
      <PageHeader title={S.title} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <h2 className="mb-4 text-[15px] font-semibold">{S.profile}</h2>
          <ProfileForm fullName={s.fullName} displayName={s.displayName} optIn={s.leaderboardOptIn} />
        </Card>
        <div className="grid content-start gap-6">
          <Card className="grid gap-4 p-5 sm:p-6">
            <div className="flex items-center justify-between"><span className="text-[14px]">{t.common.language}</span><LocaleSwitcher /></div>
            <div className="flex items-center justify-between"><span className="text-[14px]">{t.common.theme}</span><ThemeToggle /></div>
          </Card>
          <Card className="p-5 sm:p-6">
            <h2 className="mb-4 text-[15px] font-semibold">{S.privacy}</h2>
            <PrivacyActions />
          </Card>
        </div>
      </div>
    </>
  );
}
