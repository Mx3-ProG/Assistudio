import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { requireAffiliate } from "@/lib/auth";
import { followUps } from "@/lib/sales/server";
import { PageHeader } from "@/components/ui/primitives";
import { BackLink } from "@/components/sales-center/back-link";
import { FollowUpList } from "@/components/copilot/follow-up-list";

/** "Who do I follow up, when, and with what?" — computed on the CRM, nothing sent automatically. */
export default async function FollowUpsPage({ params }: PageProps<"/[locale]/dashboard/sales-center/follow-ups">) {
  const { locale } = (await params) as { locale: Locale };
  const s = await requireAffiliate(locale);
  const t = await getDictionary(locale);
  const { due, upcoming } = await followUps(s, locale, t);
  return (
    <div className="space-y-6">
      <BackLink href={`/${locale}/dashboard/sales-center`} label={t.cp.title} />
      <PageHeader title={t.cp.followUps.title} subtitle={t.cp.followUps.subtitle} />
      <FollowUpList due={due} upcoming={upcoming} />
    </div>
  );
}
