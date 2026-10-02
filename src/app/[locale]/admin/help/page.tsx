import Link from "next/link";
import { LifeBuoy } from "lucide-react";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { requireStaff } from "@/lib/auth";
import { repo } from "@/lib/data";
import { PageHeader, Card, EmptyState } from "@/components/ui/primitives";
import { HelpRequestCard } from "@/components/admin/help-request-card";
import { cn } from "@/lib/cn";
import { MarkHelpSeen } from "@/components/help/mark-seen";
import { HELP_NOTIFICATION_KEYS } from "@/lib/badges";

/** Help requests sent by partners from their dashboard (also emailed to every staff member). */
export default async function AdminHelp({ params, searchParams }: PageProps<"/[locale]/admin/help">) {
  const { locale } = (await params) as { locale: Locale };
  const tab = (await searchParams).tab === "all" ? "all" : "open";
  const s = await requireStaff(locale);
  const t = await getDictionary(locale);
  const A = t.net.admin;
  const [requests, network, unread] = await Promise.all([
    repo().adminListHelpRequests(s, tab === "open" ? { status: ["open", "in_progress"] } : {}),
    repo().adminNetwork(s),
    repo().listNotifications(s, "unread").catch(() => []),
  ]);
  const unseen = unread.some((n) => (HELP_NOTIFICATION_KEYS.staff as readonly string[]).includes(n.titleKey));
  const profileOf = new Map(network.map((m) => [m.id, m.profileId]));
  // Urgent first, then oldest open first so nothing waits forever.
  const sorted = tab === "open"
    ? [...requests].sort((a, b) => Number(b.urgency === "high") - Number(a.urgency === "high") || a.createdAt.localeCompare(b.createdAt))
    : requests;
  const base = `/${locale}/admin/help`;

  return (
    <>
      <MarkHelpSeen scope="admin" pending={unseen} />
      <PageHeader title={A.title} subtitle={A.subtitle} />
      <nav className="mb-4 flex gap-1">
        {(["open", "all"] as const).map((k) => (
          <Link key={k} href={k === "open" ? base : `${base}?tab=all`} aria-current={tab === k ? "page" : undefined}
            className={cn("h-8 rounded-full px-3 text-[13px] leading-8 transition", tab === k ? "bg-fg text-bg" : "text-fg-2 hover:bg-surface-2")}>
            {A.tabs[k]}
          </Link>
        ))}
      </nav>
      <Card className="overflow-hidden">
        {sorted.length === 0 ? (
          <EmptyState icon={<LifeBuoy className="size-5" />} title={A.empty} />
        ) : (
          <div className="divide-y divide-line">
            {sorted.map((r) => <HelpRequestCard key={r.id} r={r} t={t} locale={locale} profileId={profileOf.get(r.affiliateId)} />)}
          </div>
        )}
      </Card>
    </>
  );
}
