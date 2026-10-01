import type { Locale } from "@/i18n/config";
import { requireAffiliate } from "@/lib/auth";
import { repo } from "@/lib/data";
import { ConversationSidebar, MessagesFrame } from "@/components/messaging/conversation-sidebar";

export default async function MessagesLayout({ children, params }: LayoutProps<"/[locale]/dashboard/messages">) {
  const { locale } = (await params) as { locale: Locale };
  const s = await requireAffiliate(locale);
  const [conversations, contacts] = await Promise.all([repo().listConversations(s), repo().listContacts(s)]);
  const base = `/${locale}/dashboard/messages`;
  // eslint-disable-next-line react-hooks/purity -- request-time snapshot so relative times hydrate identically
  const now = Date.now();
  return (
    <MessagesFrame base={base} className="-mt-2 h-[calc(100dvh-12rem)] lg:h-[calc(100dvh-8.5rem)]"
      sidebar={<ConversationSidebar base={base} me={s.userId} now={now} conversations={conversations} contacts={contacts} />}>
      {children}
    </MessagesFrame>
  );
}
