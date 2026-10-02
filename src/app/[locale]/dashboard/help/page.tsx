import Link from "next/link";
import { LifeBuoy, MessageCircle } from "lucide-react";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { requireAffiliate } from "@/lib/auth";
import { repo } from "@/lib/data";
import { listAffiliateDossiers } from "@/lib/contracts/service";
import { HELP_CATEGORIES, type HelpCategory } from "@/lib/data/types";
import { formatRelative } from "@/lib/money";
import { PageHeader, Card, CardHeader, Badge, EmptyState } from "@/components/ui/primitives";
import { HelpForm } from "@/components/help/help-form";
import { helpTone } from "@/components/help/tone";
import { MarkHelpSeen } from "@/components/help/mark-seen";
import { HELP_NOTIFICATION_KEYS } from "@/lib/badges";

/**
 * "Help": the partner asks the Studio ATS team. The request is stored with a
 * database-computed snapshot of the account and emailed to every staff member.
 * Query: ?prospect=<id>&dossier=<id>&topic=<category>&from=<path> prefill it.
 */
export default async function HelpPage({ params, searchParams }: PageProps<"/[locale]/dashboard/help">) {
  const { locale } = (await params) as { locale: Locale };
  const sp = await searchParams;
  const s = await requireAffiliate(locale);
  const t = await getDictionary(locale);
  const H = t.net.help;
  const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);
  const [requests, prospects, dossiers, unread] = await Promise.all([
    repo().listMyHelpRequests(s),
    repo().listProspects(s),
    listAffiliateDossiers(s).catch(() => []),
    repo().listNotifications(s, "unread").catch(() => []),
  ]);
  const unseenReplies = unread.some((n) => (HELP_NOTIFICATION_KEYS.partner as readonly string[]).includes(n.titleKey));
  const topic = one(sp.topic);
  const from = one(sp.from);

  return (
    <>
      <MarkHelpSeen scope="dashboard" pending={unseenReplies} />
      <PageHeader title={H.title} subtitle={H.subtitle} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <Card className="p-5 sm:p-6">
          <HelpForm
            prospects={prospects.filter((p) => p.stage !== "lost").map((p) => ({ id: p.id, label: [p.name, p.company].filter(Boolean).join(" · ") }))}
            dossiers={dossiers.map((d) => ({ id: d.id, label: `${d.ref} · ${d.clientCompany || d.clientName || d.clientEmail}` }))}
            defaults={{
              category: HELP_CATEGORIES.includes(topic as HelpCategory) ? (topic as HelpCategory) : one(sp.prospect) ? "prospect" : one(sp.dossier) ? "contract" : undefined,
              prospectId: one(sp.prospect), dossierId: one(sp.dossier),
              pagePath: from && from.startsWith("/") ? from.slice(0, 300) : `/${locale}/dashboard/help`,
            }}
          />
          <Link href={`/${locale}/dashboard/messages`} className="mt-5 inline-flex items-center gap-1.5 text-[13px] text-accent">
            <MessageCircle className="size-3.5" />{H.messages}
          </Link>
        </Card>
        <Card>
          <CardHeader title={H.history} />
          {requests.length === 0 ? (
            <EmptyState icon={<LifeBuoy className="size-5" />} title={H.empty} />
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {requests.map((r) => (
                <li key={r.id} className="px-5 py-4 sm:px-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={helpTone[r.status]}>{t.net.statuses[r.status]}</Badge>
                    <span className="text-[12px] text-muted">{r.ref} · {t.net.categories[r.category]} · {formatRelative(r.createdAt, locale)}</span>
                  </div>
                  <p className="mt-1.5 font-medium">{r.subject}</p>
                  <p className="mt-1 line-clamp-3 whitespace-pre-line text-[13px] text-fg-2">{r.message}</p>
                  {r.staffNote && (
                    <p className="mt-2 rounded-xl bg-surface-2 px-3 py-2 text-[13px]">
                      <span className="font-medium">{H.teamNote} · </span><span className="whitespace-pre-line">{r.staffNote}</span>
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
