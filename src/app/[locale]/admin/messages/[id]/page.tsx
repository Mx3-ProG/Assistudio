import { notFound } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { requireStaff } from "@/lib/auth";
import { repo } from "@/lib/data";
import { isDemoMode } from "@/lib/env";
import { Thread } from "@/components/messaging/thread";

export default async function AdminConversationPage({ params }: PageProps<"/[locale]/admin/messages/[id]">) {
  const { locale, id } = (await params) as { locale: Locale; id: string };
  const s = await requireStaff(locale);
  const view = await repo().getConversation(s, id).catch(() => null);
  if (!view) notFound();
  return (
    <Thread key={view.id} view={view} me={s.userId} myName={s.displayName || s.fullName}
      realtime={!isDemoMode} backHref={`/${locale}/admin/messages`} />
  );
}
