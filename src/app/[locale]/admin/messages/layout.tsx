import type { Locale } from "@/i18n/config";
import { requireStaff } from "@/lib/auth";
import { repo } from "@/lib/data";
import { AdminConversationSidebar, MessagesFrame } from "@/components/messaging/conversation-sidebar";

export default async function AdminMessagesLayout({ children, params }: LayoutProps<"/[locale]/admin/messages">) {
  const { locale } = (await params) as { locale: Locale };
  const s = await requireStaff(locale);
  const [inbox, conversations, reports] = await Promise.all([
    repo().listSupportInbox(s), repo().listConversations(s), repo().listMessageReports(s),
  ]);
  const base = `/${locale}/admin/messages`;
  // eslint-disable-next-line react-hooks/purity -- request-time snapshot so relative times hydrate identically
  const now = Date.now();
  return (
    <MessagesFrame base={base} className="h-[calc(100dvh-11rem)]"
      sidebar={<AdminConversationSidebar base={base} me={s.userId} now={now} inbox={inbox} conversations={conversations}
        reportsOpen={reports.filter((r) => r.status === "open").length} />}>
      {children}
    </MessagesFrame>
  );
}
