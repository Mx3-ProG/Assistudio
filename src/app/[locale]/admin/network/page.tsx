import Link from "next/link";
import { Search } from "lucide-react";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { fmt } from "@/i18n/format";
import { requireStaff } from "@/lib/auth";
import { repo } from "@/lib/data";
import { listAdminDossierSummaries, STAFF_DOSSIER_STATUSES } from "@/lib/contracts/service";
import {
  buildNetwork, filterMembers, networkTotals, rankBy, sortMembers, MIN_PROSPECTS_FOR_CONVERSION,
  type NetworkMember, type RankMetric, type SortKey,
} from "@/lib/admin/network";
import { formatMoney, formatNumber, formatPercent } from "@/lib/money";
import { PageHeader, Card, CardHeader, Badge, inputClass } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";
import { NeedBadge } from "@/components/admin/need-badge";
import { cn } from "@/lib/cn";

const SORTS: SortKey[] = ["needs", "recent", "name", "revenue", "prospects", "recruits", "conversion", "sales", "earned", "owed"];
const FILTERS = ["all", "needs", "pending", "inactive", "top"] as const;
const RANKS: RankMetric[] = ["revenue", "conversion", "prospects", "recruits", "sales", "earned"];
const statusTone = { pending: "warning", approved: "success", rejected: "neutral", suspended: "danger" } as const;

function TreeNode({ m, depth, byId, base, labels }: {
  m: NetworkMember; depth: number; byId: Map<string, NetworkMember>; base: string; labels: { network: string; sales: string };
}) {
  return (
    <li>
      <div className="flex items-center gap-2 py-1" style={{ paddingInlineStart: depth * 18 }}>
        {depth > 0 && <span className="text-muted">└</span>}
        <Link href={`${base}/${m.id}`} className="font-medium hover:text-accent">{m.name}</Link>
        <span className="text-[12px] text-muted">
          {fmt(labels.sales, { n: m.paidSales })}{m.networkSize > 0 && ` · ${fmt(labels.network, { n: m.networkSize })}`}
        </span>
      </div>
      {m.recruitIds.length > 0 && (
        <ul>
          {m.recruitIds.map((id) => byId.get(id)).filter((x): x is NetworkMember => !!x)
            .map((c) => <TreeNode key={c.id} m={c} depth={depth + 1} byId={byId} base={base} labels={labels} />)}
        </ul>
      )}
    </li>
  );
}

/**
 * The admin network: who is who, who sponsored whom, what each partner sells
 * and is owed, and who needs something. Read-only here; every action lives on
 * the partner file (/admin/network/[id]) and is audited.
 */
export default async function AdminNetwork({ params, searchParams }: PageProps<"/[locale]/admin/network">) {
  const { locale } = (await params) as { locale: Locale };
  const sp = await searchParams;
  const s = await requireStaff(locale);
  const t = await getDictionary(locale);
  const N = t.net;
  const [rows, settings, dossiers] = await Promise.all([
    repo().adminNetwork(s), repo().getSettings(), listAdminDossierSummaries(s).catch(() => []),
  ]);
  const dossiersToAct: Record<string, number> = {};
  for (const d of dossiers) if (STAFF_DOSSIER_STATUSES.includes(d.status)) dossiersToAct[d.affiliateId] = (dossiersToAct[d.affiliateId] ?? 0) + 1;
  const members = buildNetwork(rows, { payoutMinimumCents: settings.payoutMinimumCents, dossiersToAct });
  const byId = new Map(members.map((m) => [m.id, m]));
  const totals = networkTotals(members);

  const q = typeof sp.q === "string" ? sp.q.slice(0, 100) : "";
  const filter = FILTERS.find((f) => f === sp.f) ?? "all";
  const sort = SORTS.find((k) => k === sp.sort) ?? "needs";
  const list = sortMembers(filterMembers(members, q, filter), sort);
  const attention = sortMembers(members.filter((m) => m.needs.length > 0), "needs");
  const base = `/${locale}/admin/network`;
  const href = (patch: Record<string, string>) => {
    const p = new URLSearchParams({ ...(q ? { q } : {}), ...(filter !== "all" ? { f: filter } : {}), ...(sort !== "needs" ? { sort } : {}), ...patch });
    for (const [k, v] of [...p]) if (!v || (k === "f" && v === "all") || (k === "sort" && v === "needs")) p.delete(k);
    return p.size ? `${base}?${p}` : base;
  };
  const pct = (r: number | null) => (r === null ? "—" : formatPercent(r, locale));

  const kpis: [string, string, string?][] = [
    [N.kpi.members, formatNumber(totals.members, locale), fmt(N.kpi.approved, { n: totals.approved })],
    [N.kpi.active30d, formatNumber(totals.active30d, locale)],
    [N.kpi.prospects, formatNumber(totals.prospects, locale)],
    [N.kpi.paidSales, formatNumber(totals.paidSales, locale)],
    [N.kpi.conversion, pct(totals.conversionRate)],
    [N.kpi.revenue, formatMoney(totals.revenueCents, locale)],
    [N.kpi.owed, formatMoney(totals.availableCents, locale), N.kpi.owedHint],
    [N.kpi.paid, formatMoney(totals.paidCents, locale)],
    [N.kpi.pending, formatMoney(totals.pendingCents, locale), N.kpi.pendingHint],
    [N.kpi.needAttention, formatNumber(totals.needAttention, locale)],
  ];
  const rankValue = (metric: RankMetric, v: number) =>
    metric === "revenue" || metric === "earned" ? formatMoney(v, locale) : metric === "conversion" ? formatPercent(v, locale) : formatNumber(v, locale);

  const roots = members.filter((m) => (!m.sponsorId || !byId.has(m.sponsorId)) && m.networkSize > 0).sort((a, b) => b.networkSize - a.networkSize);

  return (
    <>
      <PageHeader title={N.title} subtitle={N.subtitle} />

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map(([label, value, hint]) => (
          <div key={label} className="card p-4">
            <div className="tabular text-[22px] font-semibold tracking-[-0.03em]">{value}</div>
            <div className="mt-1.5 text-[12px] text-muted">{label}</div>
            {hint && <div className="text-[11.5px] text-muted/80">{hint}</div>}
          </div>
        ))}
      </section>
      <p className="mt-3 text-[12px] text-muted">{fmt(N.conversionHint, { n: MIN_PROSPECTS_FOR_CONVERSION })}</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <Card>
          <CardHeader title={N.attention.title} action={attention.length > 0 && <Link href={href({ f: "needs" })} className="text-[13px] text-accent">{t.common.viewAll}</Link>} />
          <ul className="mt-3 divide-y divide-line">
            {attention.length === 0 && <li className="px-6 py-8 text-center text-[14px] text-muted">{N.attention.empty}</li>}
            {attention.slice(0, 8).map((m) => (
              <li key={m.id}>
                <Link href={`${base}/${m.id}`} className="flex flex-wrap items-center gap-2 px-5 py-3 hover:bg-surface-2 sm:px-6">
                  <span className="min-w-0 flex-1 truncate font-medium">{m.name}</span>
                  <span className="flex flex-wrap gap-1">{m.needs.map((n) => <NeedBadge key={n} need={n} label={N.needs[n]} />)}</span>
                </Link>
              </li>
            ))}
            {attention.length > 8 && <li className="px-6 py-3 text-[13px] text-muted">{fmt(N.attention.more, { n: attention.length - 8 })}</li>}
          </ul>
        </Card>

        <Card>
          <CardHeader title={N.rank.title} />
          <div className="mt-3 grid gap-x-6 gap-y-5 px-5 pb-5 sm:grid-cols-2 sm:px-6">
            {RANKS.map((metric) => {
              const top = rankBy(members, metric, 5);
              return (
                <div key={metric}>
                  <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">
                    {N.rank[metric]}{metric === "earned" && <span className="font-normal normal-case tracking-normal"> · {N.rank.earnedHint}</span>}
                  </p>
                  {top.length === 0 ? <p className="text-[13px] text-muted">{N.rank.empty}</p> : (
                    <ol className="grid gap-1">
                      {top.map(({ member, value }, i) => (
                        <li key={member.id} className="flex items-center gap-2 text-[13.5px]">
                          <span className="tabular w-4 text-muted">{i + 1}</span>
                          <Link href={`${base}/${member.id}`} className="min-w-0 flex-1 truncate hover:text-accent">{member.name}</Link>
                          <span className="tabular font-medium">{rankValue(metric, value)}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title={N.table.title} subtitle={fmt(N.table.count, { n: list.length })} />
        <form method="get" className="mt-3 flex flex-col gap-2 px-5 sm:flex-row sm:items-center sm:px-6">
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input name="q" defaultValue={q} placeholder={N.table.search} className={cn(inputClass, "h-10 ps-9 text-[14px]")} />
          </label>
          {filter !== "all" && <input type="hidden" name="f" value={filter} />}
          <select name="sort" defaultValue={sort} aria-label={N.table.sortBy} className="h-10 shrink-0 rounded-xl border border-line bg-surface px-3 text-[14px] text-fg outline-none focus:border-accent sm:w-56">
            {SORTS.map((k) => <option key={k} value={k}>{N.table.sortBy} · {N.table.sorts[k]}</option>)}
          </select>
          <button className={buttonClass("secondary", "sm")}>{N.table.apply}</button>
        </form>
        <nav className="no-scrollbar mt-3 flex gap-1 overflow-x-auto px-5 sm:px-6">
          {FILTERS.map((f) => (
            <Link key={f} href={href({ f })} aria-current={filter === f ? "page" : undefined}
              className={cn("h-8 shrink-0 rounded-full px-3 text-[13px] leading-8 transition", filter === f ? "bg-fg text-bg" : "text-fg-2 hover:bg-surface-2")}>
              {N.table.filters[f]}
            </Link>
          ))}
        </nav>

        {list.length === 0 ? <p className="px-6 py-10 text-center text-[14px] text-muted">{N.table.empty}</p> : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[980px] text-[13.5px]">
              <thead>
                <tr className="border-y border-line text-start text-[11.5px] uppercase tracking-[0.06em] text-muted">
                  <th className="px-5 py-2 text-start font-medium sm:px-6">{N.table.partner}</th>
                  <th className="px-3 py-2 text-start font-medium">{N.table.sponsor}</th>
                  <th className="px-3 py-2 text-end font-medium">{N.table.recruits}</th>
                  <th className="px-3 py-2 text-end font-medium">{N.table.prospects}</th>
                  <th className="px-3 py-2 text-end font-medium">{N.table.sales}</th>
                  <th className="px-3 py-2 text-end font-medium">{N.table.conversion}</th>
                  <th className="px-3 py-2 text-end font-medium">{N.table.revenue}</th>
                  <th className="px-3 py-2 text-end font-medium">{N.table.owed}</th>
                  <th className="px-3 py-2 text-end font-medium">{N.table.paid}</th>
                  <th className="px-3 py-2 text-end font-medium">{N.table.pending}</th>
                  <th className="px-5 py-2 text-start font-medium sm:px-6" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {list.map((m) => (
                  <tr key={m.id} className="align-top hover:bg-surface-2/60">
                    <td className="px-5 py-3 sm:px-6">
                      <Link href={`${base}/${m.id}`} className="font-medium hover:text-accent">{m.name}</Link>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[12px] text-muted">
                        <Badge tone={statusTone[m.status]}>{t.admin.affiliateStatuses[m.status]}</Badge>
                        {(m.role === "admin" || m.role === "super_admin") && <Badge tone="accent">{N.table.staff}</Badge>}
                        <span>{m.code}{m.country ? ` · ${m.country}` : ""}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">{m.sponsorId && byId.has(m.sponsorId)
                      ? <Link href={`${base}/${m.sponsorId}`} className="hover:text-accent">{m.sponsorName}</Link> : <span className="text-muted">{N.table.noSponsor}</span>}
                    </td>
                    <td className="tabular px-3 py-3 text-end">{m.recruits}</td>
                    <td className="tabular px-3 py-3 text-end">{m.totalProspects}</td>
                    <td className="tabular px-3 py-3 text-end">{m.paidSales}</td>
                    <td className="tabular px-3 py-3 text-end">{pct(m.conversionRate)}</td>
                    <td className="tabular px-3 py-3 text-end">{formatMoney(m.revenueCents, locale)}</td>
                    <td className="tabular px-3 py-3 text-end font-medium">{formatMoney(m.availableCents, locale)}</td>
                    <td className="tabular px-3 py-3 text-end">{formatMoney(m.paidCents, locale)}</td>
                    <td className="tabular px-3 py-3 text-end text-muted">{formatMoney(m.pendingCents + m.disputedCents, locale)}</td>
                    <td className="px-5 py-3 sm:px-6">
                      <span className="flex flex-wrap gap-1">{m.needs.slice(0, 3).map((n) => <NeedBadge key={n} need={n} label={N.needs[n]} />)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {roots.length > 0 && (
        <Card className="mt-6">
          <CardHeader title={N.tree.title} subtitle={N.tree.hint} />
          <ul className="mt-2 grid gap-3 px-5 pb-5 text-[14px] sm:px-6 lg:grid-cols-2">
            {roots.map((r) => <TreeNode key={r.id} m={r} depth={0} byId={byId} base={base} labels={N.tree} />)}
          </ul>
        </Card>
      )}
    </>
  );
}
