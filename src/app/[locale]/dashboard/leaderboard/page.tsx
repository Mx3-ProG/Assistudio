import { notFound } from "next/navigation";
import { Trophy } from "lucide-react";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { fmt } from "@/i18n/format";
import { requireAffiliate } from "@/lib/auth";
import { repo } from "@/lib/data";
import { PageHeader, Card, Notice, EmptyState } from "@/components/ui/primitives";
import { LeaderboardOptIn } from "@/components/dashboard/leaderboard-optin";
import { cn } from "@/lib/cn";

/** Configurable (settings.leaderboard.enabled). Pseudonyms only, opt-in. */
export default async function Leaderboard({ params }: PageProps<"/[locale]/dashboard/leaderboard">) {
  const { locale } = (await params) as { locale: Locale };
  const s = await requireAffiliate(locale);
  const t = await getDictionary(locale);
  const settings = await repo().getSettings();
  if (!settings.leaderboardEnabled) notFound();
  const rows = await repo().getLeaderboard(s);
  const L = t.dash.leaderboard;
  return (
    <>
      <PageHeader title={L.title} subtitle={L.subtitle} />
      <Card className="overflow-hidden">
        {rows.length === 0 ? <EmptyState icon={<Trophy className="size-5" />} title={t.common.empty} /> : (
          <ol className="divide-y divide-line">
            {rows.map((r) => (
              <li key={`${r.rank}-${r.displayName}`} className={cn("flex items-center gap-4 px-5 py-4 sm:px-6", r.isMe && "bg-accent-soft")}>
                <span className={cn("tabular grid size-9 place-items-center rounded-full text-[14px] font-semibold",
                  r.rank === 1 ? "bg-warning text-black" : r.rank <= 3 ? "bg-surface-3" : "bg-surface-2 text-muted")}>{r.rank}</span>
                <span className="flex-1 font-medium">{r.displayName}{r.isMe && <span className="ms-2 text-[12px] text-accent">({L.you})</span>}</span>
                <span className="tabular text-[14px] text-fg-2">{fmt(L.sales, { n: r.sales })}</span>
              </li>
            ))}
          </ol>
        )}
      </Card>
      <Card className="mt-6 p-5"><LeaderboardOptIn value={s.leaderboardOptIn} /></Card>
      <div className="mt-4"><Notice>{L.privacy}</Notice></div>
    </>
  );
}
