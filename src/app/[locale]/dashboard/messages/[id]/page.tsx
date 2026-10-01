import { notFound } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { requireAffiliate } from "@/lib/auth";
import { repo } from "@/lib/data";
import { isDemoMode } from "@/lib/env";
import { Thread } from "@/components/messaging/thread";

export default async function ConversationPage({ params }: PageProps<"/[locale]/dashboard/messages/[id]">) {
  const { locale, id } = (await params) as { locale: Locale; id: string };
  const s = await requireAffiliate(locale);
  const view = await repo().getConversation(s, id).catch(() => null);
  if (!view) notFound();
  return (
    <Thread key={view.id} view={view} me={s.userId} myName={s.displayName || s.fullName}
      realtime={!isDemoMode} backHref={`/${locale}/dashboard/messages`} />
  );
}
