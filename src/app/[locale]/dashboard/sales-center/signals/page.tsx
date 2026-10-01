import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { requireAffiliate } from "@/lib/auth";
import { salesContext, ofKind } from "@/lib/sales/server";
import { PageHeader } from "@/components/ui/primitives";
import { BackLink } from "@/components/sales-center/back-link";
import { SignalLibrary } from "@/components/sales-center/signal-library";

export default async function SignalsPage({ params }: PageProps<"/[locale]/dashboard/sales-center/signals">) {
  const { locale } = (await params) as { locale: Locale };
  const s = await requireAffiliate(locale);
  const [t, ctx] = await Promise.all([getDictionary(locale), salesContext(s, locale)]);
  return <div className="space-y-5">
    <BackLink href={`/${locale}/dashboard/sales-center`} label={t.cp.title} />
    <PageHeader title={t.cp.signals.title} subtitle={t.cp.signals.subtitle} />
    <SignalLibrary items={ofKind(ctx.content, "signal")} />
  </div>;
}
