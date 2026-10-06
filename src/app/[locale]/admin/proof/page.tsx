import Link from "next/link";
import { MessageSquareQuote } from "lucide-react";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { requireStaff } from "@/lib/auth";
import { repo } from "@/lib/data";
import { PageHeader, Card, EmptyState } from "@/components/ui/primitives";
import { TestimonialAdmin, InvitePanel, ProofEventsPanel } from "@/components/admin/proof-admin";
import { cn } from "@/lib/cn";

const TABS = ["pending", "approved", "other", "invites", "events"] as const;
type Tab = (typeof TABS)[number];

/**
 * Reviews & social proof: moderation (approve / reject / hide), presentation
 * metadata and placements, client invites, verified proof events. Every action
 * is a SECURITY DEFINER function, audited; a review's words cannot be edited.
 */
export default async function AdminProof({ params, searchParams }: PageProps<"/[locale]/admin/proof">) {
  const { locale } = (await params) as { locale: Locale };
  const raw = (await searchParams).tab;
  const tab: Tab = (TABS as readonly string[]).includes(String(raw)) ? (raw as Tab) : "pending";
  const s = await requireStaff(locale);
  const t = await getDictionary(locale);
  const A = t.pf.admin;
  const base = `/${locale}/admin/proof`;

  const [pendingCount, body] = await Promise.all([
    repo().adminListTestimonials(s, ["pending"]).then((x) => x.length).catch(() => 0),
    (async () => {
      if (tab === "invites") {
        const [candidates, invites] = await Promise.all([repo().adminListInviteCandidates(s), repo().adminListTestimonialInvites(s)]);
        return <InvitePanel candidates={candidates} invites={invites} />;
      }
      if (tab === "events") {
        const [events, candidates] = await Promise.all([repo().adminListProofEvents(s), repo().adminListProofEventCandidates(s)]);
        return <ProofEventsPanel events={events} candidates={candidates} />;
      }
      const list = await repo().adminListTestimonials(s, tab === "pending" ? ["pending"] : tab === "approved" ? ["approved"] : ["rejected", "hidden"]);
      // Oldest first while moderating, so nothing waits forever.
      const sorted = tab === "pending" ? [...list].sort((a, b) => a.createdAt.localeCompare(b.createdAt)) : list;
      return sorted.length ? <div className="divide-y divide-line">{sorted.map((r) => <TestimonialAdmin key={r.id} r={r} />)}</div>
        : <EmptyState icon={<MessageSquareQuote className="size-5" />} title={A.empty} />;
    })(),
  ]);

  return (
    <>
      <PageHeader title={A.title} subtitle={A.subtitle} />
      <nav className="no-scrollbar mb-4 flex gap-1 overflow-x-auto">
        {TABS.map((k) => (
          <Link key={k} href={k === "pending" ? base : `${base}?tab=${k}`} aria-current={tab === k ? "page" : undefined}
            className={cn("h-8 shrink-0 rounded-full px-3 text-[13px] leading-8 transition", tab === k ? "bg-fg text-bg" : "text-fg-2 hover:bg-surface-2")}>
            {A.tabs[k]}{k === "pending" && pendingCount > 0 && <span className="ms-1.5 rounded-full bg-danger px-1.5 text-[11px] font-semibold text-white">{pendingCount}</span>}
          </Link>
        ))}
      </nav>
      <Card className="overflow-hidden">{body}</Card>
    </>
  );
}
