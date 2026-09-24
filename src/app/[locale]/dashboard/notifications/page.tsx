import Link from "next/link";
import { Bell } from "lucide-react";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { fmt } from "@/i18n/format";
import { requireSession } from "@/lib/auth";
import { repo } from "@/lib/data";
import { formatMoney, formatRelative } from "@/lib/money";
import { markNotificationsRead } from "@/app/actions/dashboard";
import { PageHeader, Card, EmptyState } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export default async function Notifications({ params }: PageProps<"/[locale]/dashboard/notifications">) {
  const { locale } = (await params) as { locale: Locale };
  const s = await requireSession(locale);
  const t = await getDictionary(locale);
  const items = await repo().listNotifications(s);
  const text = t.notificationsText as Record<string, string>;
  return (
    <>
      <PageHeader
        title={t.dash.notifications.title}
        action={items.some((n) => !n.readAt) && (
          <form action={markNotificationsRead}><button className={buttonClass("secondary", "sm")}>{t.dash.notifications.markAllRead}</button></form>
        )}
      />
      <Card className="overflow-hidden">
        {items.length === 0 ? <EmptyState icon={<Bell className="size-5" />} title={t.dash.notifications.empty} /> : (
          <ul className="divide-y divide-line">
            {items.map((n) => (
              <li key={n.id}>
                <Link href={n.href ? `/${locale}${n.href}` : "#"} className={cn("flex items-start gap-3 px-5 py-4 hover:bg-surface-2/50 sm:px-6", !n.readAt && "bg-accent-soft/40")}>
                  <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.readAt ? "bg-transparent" : "bg-accent")} />
                  <span className="flex-1 text-[14px]">{fmt(text[n.titleKey] ?? n.titleKey, typeof n.params.amount_cents === "number" ? { ...n.params, amount: formatMoney(n.params.amount_cents, locale) } : n.params)}</span>
                  <time className="shrink-0 text-[12px] text-muted">{formatRelative(n.createdAt, locale)}</time>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
