import Link from "next/link";
import { Archive, ArchiveRestore, Bell, Check, CircleDot } from "lucide-react";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { fmt } from "@/i18n/format";
import { requireSession } from "@/lib/auth";
import { repo } from "@/lib/data";
import type { Notification, NotificationStatus } from "@/lib/data/types";
import { formatDate, formatMoney, formatRelative } from "@/lib/money";
import { markNotificationsRead, setNotificationStatus } from "@/app/actions/dashboard";
import { PageHeader, Card, EmptyState } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const TABS = ["inbox", "unread", "read", "archived"] as const;
type Tab = (typeof TABS)[number];

/** Amounts are stored in cents with their currency; dates as ISO. Format for the reader. */
function paramsFor(n: Notification, locale: Locale): Record<string, string | number> {
  const p = n.params ?? {};
  const cur = typeof p.currency === "string" ? p.currency : "EUR";
  const out: Record<string, string | number> = { ...p };
  if (typeof p.commission_cents === "number") out.commission = formatMoney(p.commission_cents, locale, cur);
  if (typeof p.amount_cents === "number") out.amount = formatMoney(p.amount_cents, locale, cur);
  else if (typeof p.commission_cents === "number") out.amount = out.commission;
  if (typeof p.ends_on === "string") out.ends_on = formatDate(p.ends_on, locale);
  return out;
}

export default async function Notifications({ params, searchParams }: PageProps<"/[locale]/dashboard/notifications">) {
  const { locale } = (await params) as { locale: Locale };
  const sp = await searchParams;
  const tab: Tab = TABS.includes(sp.tab as Tab) ? (sp.tab as Tab) : "inbox";
  const s = await requireSession(locale);
  const t = await getDictionary(locale);
  const N = t.dash.notifications;
  const items = await repo().listNotifications(s, tab as NotificationStatus | "inbox");
  const text = t.notificationsText as Record<string, string>;
  const base = `/${locale}/dashboard/notifications`;
  const helpStatuses = t.net.statuses as Record<string, string>;
  const labelled = (n: Notification) => {
    const p = paramsFor(n, locale);
    return n.titleKey === "helpUpdated" && typeof p.status === "string" ? { ...p, status: helpStatuses[p.status] ?? p.status } : p;
  };

  const action = (n: Notification, status: NotificationStatus, label: string, Icon: typeof Check) => (
    <form action={setNotificationStatus}>
      <input type="hidden" name="id" value={n.id} />
      <input type="hidden" name="status" value={status} />
      <button className="grid size-8 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-fg" title={label} aria-label={label}>
        <Icon className="size-4" />
      </button>
    </form>
  );

  return (
    <>
      <PageHeader
        title={N.title}
        action={items.some((n) => n.status === "unread") && (
          <form action={markNotificationsRead}><button className={buttonClass("secondary", "sm")}>{N.markAllRead}</button></form>
        )}
      />
      <nav className="mb-4 flex gap-1 overflow-x-auto" aria-label={N.title}>
        {TABS.map((k) => (
          <Link key={k} href={k === "inbox" ? base : `${base}?tab=${k}`} aria-current={tab === k ? "page" : undefined}
            className={cn("whitespace-nowrap rounded-full px-4 py-1.5 text-[13px] font-medium",
              tab === k ? "bg-fg text-bg" : "text-muted hover:bg-surface-2")}>
            {N.tabs[k]}
          </Link>
        ))}
      </nav>
      <Card className="overflow-hidden">
        {items.length === 0 ? <EmptyState icon={<Bell className="size-5" />} title={N.empty} /> : (
          <ul className="divide-y divide-line">
            {items.map((n) => (
              <li key={n.id} className={cn("flex items-center gap-2 pe-3 sm:pe-4", n.status === "unread" && "bg-accent-soft/40")}>
                <Link href={n.href ? `/${locale}${n.href}` : "#"} className="flex min-w-0 flex-1 items-start gap-3 px-5 py-4 hover:bg-surface-2/50 sm:px-6">
                  <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.status === "unread" ? "bg-accent" : "bg-transparent")} />
                  <span className="min-w-0 flex-1 text-[14px]">{fmt(text[n.titleKey] ?? n.titleKey, labelled(n))}</span>
                  <time className="shrink-0 text-[12px] text-muted" dateTime={n.createdAt}>{formatRelative(n.createdAt, locale)}</time>
                </Link>
                {n.status === "unread" && action(n, "read", N.markRead, Check)}
                {n.status === "read" && action(n, "unread", N.markUnread, CircleDot)}
                {n.status !== "archived" ? action(n, "archived", N.archive, Archive) : action(n, "read", N.unarchive, ArchiveRestore)}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
