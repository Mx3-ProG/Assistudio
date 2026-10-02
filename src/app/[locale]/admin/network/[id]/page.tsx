import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { fmt } from "@/i18n/format";
import { requireStaff } from "@/lib/auth";
import { repo } from "@/lib/data";
import { listAdminDossierSummaries, STAFF_DOSSIER_STATUSES } from "@/lib/contracts/service";
import { dossierStatusLabel } from "@/content/contracts";
import { buildNetwork } from "@/lib/admin/network";
import { formatDate, formatMoney, formatNumber, formatPercent, formatRelative } from "@/lib/money";
import { setAffiliateStatus, createPayout } from "@/app/actions/admin";
import { PageHeader, Card, CardHeader, Badge } from "@/components/ui/primitives";
import { ReasonAction } from "@/components/admin/reason-action";
import { PayoutCreate } from "@/components/admin/payout-create";
import { NeedBadge } from "@/components/admin/need-badge";
import { HelpRequestCard } from "@/components/admin/help-request-card";
import { MessageMemberButton } from "@/components/messaging/conversation-sidebar";
import { saleTone, commissionTone, payoutTone } from "@/components/dashboard/status";

const statusTone = { pending: "warning", approved: "success", rejected: "neutral", suspended: "danger" } as const;

function Section({ title, count, empty, children }: { title: string; count: number; empty: string; children: React.ReactNode }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader title={`${title} (${count})`} />
      {count === 0 ? <p className="px-6 py-6 text-[14px] text-muted">{empty}</p> : <div className="mt-3">{children}</div>}
    </Card>
  );
}

/** Partner file: identity, sponsor & recruits, money, needs, help requests, contracts, prospects (with contact details), sales, commissions, payouts. */
export default async function AdminPartner({ params }: PageProps<"/[locale]/admin/network/[id]">) {
  const { locale, id } = (await params) as { locale: Locale; id: string };
  const s = await requireStaff(locale);
  const t = await getDictionary(locale);
  const N = t.net;
  const D = N.detail;
  const [rows, settings, dossiers] = await Promise.all([
    repo().adminNetwork(s), repo().getSettings(), listAdminDossierSummaries(s, id).catch(() => []),
  ]);
  if (!rows.some((r) => r.id === id)) notFound();
  const toAct = dossiers.filter((d) => STAFF_DOSSIER_STATUSES.includes(d.status)).length;
  const members = buildNetwork(rows, { payoutMinimumCents: settings.payoutMinimumCents, dossiersToAct: { [id]: toAct } });
  const m = members.find((x) => x.id === id)!;
  const recruits = m.recruitIds.map((r) => members.find((x) => x.id === r)!).sort((a, b) => b.revenueCents - a.revenueCents);
  const detail = await repo().adminAffiliateDetail(s, id);
  const base = `/${locale}/admin`;
  const money = (c: number) => formatMoney(c, locale);
  const payable = m.status === "approved" && m.availableCents >= settings.payoutMinimumCents && m.availableCents > 0;
  const A = t.admin;

  return (
    <>
      <Link href={`${base}/network`} className="mb-3 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-fg">
        <ArrowLeft className="flip-rtl size-3.5" />{D.back}
      </Link>
      <PageHeader
        title={m.name}
        subtitle={`${m.email} · ${m.code}${m.country ? ` · ${m.country}` : ""} · ${fmt(D.since, { date: formatDate(m.createdAt, locale) })}`}
        action={<Badge tone={statusTone[m.status]}>{A.affiliateStatuses[m.status]}</Badge>}
      />

      <div className="mb-6 flex flex-wrap items-start gap-2">
        <MessageMemberButton profileId={m.profileId} base={`${base}/messages`} />
        {m.status !== "approved" && <ReasonAction action={setAffiliateStatus} fields={{ id: m.id, status: "approved" }} label={m.status === "suspended" ? A.reinstate : A.approve} variant="primary" />}
        {m.status === "pending" && <ReasonAction action={setAffiliateStatus} fields={{ id: m.id, status: "rejected" }} label={A.reject} />}
        {m.status === "approved" && <ReasonAction action={setAffiliateStatus} fields={{ id: m.id, status: "suspended" }} label={A.suspend} variant="danger" />}
        {payable && <PayoutCreate action={createPayout} affiliateId={m.id} label={`${A.createPayout} · ${money(m.availableCents)}`} />}
        <Link href={`${base}/finance?affiliateId=${m.id}`} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line px-3 text-[12.5px] font-medium hover:bg-surface-2">
          <ExternalLink className="size-3.5" />{D.finance}
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap gap-1.5">
        {m.needs.length === 0 ? <span className="text-[13px] text-muted">{D.noNeeds}</span> : m.needs.map((n) => <NeedBadge key={n} need={n} label={N.needs[n]} />)}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 sm:p-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">{D.money.title}</p>
          <dl className="mt-3 grid gap-2 text-[14px]">
            {([
              [D.money.revenue, money(m.revenueCents)],
              [D.money.available, money(m.availableCents)],
              [D.money.paid, money(m.paidCents)],
              [D.money.pending, money(m.pendingCents)],
              ...(m.disputedCents ? [[D.money.disputed, money(m.disputedCents)]] : []),
              [D.money.sponsor, money(m.sponsorEarnedCents)],
            ] as [string, string][]).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3"><dt className="text-fg-2">{k}</dt><dd className="tabular font-medium">{v}</dd></div>
            ))}
          </dl>
          <p className="mt-3 text-[12px] text-muted">{fmt(D.money.minimum, { amount: money(settings.payoutMinimumCents) })}</p>
        </Card>

        <Card className="p-5 sm:p-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">{D.stats.title}</p>
          <dl className="mt-3 grid gap-2 text-[14px]">
            {([
              [N.table.prospects, formatNumber(m.prospects, locale)],
              [D.stats.leads, formatNumber(m.leads, locale)],
              [D.stats.won, formatNumber(m.prospectsWon, locale)],
              [N.table.sales, formatNumber(m.paidSales, locale)],
              [D.stats.renewals, formatNumber(m.renewals, locale)],
              [D.stats.conversion, m.conversionRate === null ? "—" : formatPercent(m.conversionRate, locale)],
              [D.stats.clicks, formatNumber(m.clicks30d, locale)],
              [D.stats.lastActivity, m.lastActivityAt ? formatRelative(m.lastActivityAt, locale) : D.stats.never],
            ] as [string, string][]).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3"><dt className="text-fg-2">{k}</dt><dd className="tabular font-medium">{v}</dd></div>
            ))}
          </dl>
        </Card>

        <Card className="p-5 sm:p-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">{D.sponsor}</p>
          <p className="mt-2 text-[14px]">
            {m.sponsorId && m.sponsorName ? <Link href={`${base}/network/${m.sponsorId}`} className="font-medium text-accent">{m.sponsorName}</Link> : <span className="text-muted">{D.noSponsor}</span>}
          </p>
          <p className="mt-5 text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">
            {D.recruits} ({m.recruits}){m.networkSize > m.recruits && <span className="font-normal normal-case tracking-normal"> · {fmt(N.tree.network, { n: m.networkSize })}</span>}
          </p>
          {recruits.length === 0 ? <p className="mt-2 text-[14px] text-muted">{D.noRecruits}</p> : (
            <ul className="mt-2 grid gap-1.5 text-[14px]">
              {recruits.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3">
                  <Link href={`${base}/network/${r.id}`} className="truncate hover:text-accent">{r.name}</Link>
                  <span className="tabular text-[12.5px] text-muted">{fmt(N.tree.sales, { n: r.paidSales })} · {money(r.revenueCents)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6">
        <Section title={D.sections.help} count={detail.help.length} empty={D.empty}>
          <div className="divide-y divide-line">
            {detail.help.map((r) => <HelpRequestCard key={r.id} r={r} t={t} locale={locale} showPartner={false} />)}
          </div>
        </Section>

        <Section title={D.sections.contracts} count={dossiers.length} empty={D.empty}>
          <ul className="divide-y divide-line">
            {dossiers.map((d) => (
              <li key={d.id}>
                <Link href={`${base}/contracts/${d.id}`} className="flex flex-wrap items-center gap-3 px-5 py-3 hover:bg-surface-2 sm:px-6">
                  <span className="min-w-0 flex-1"><span className="font-medium">{d.clientCompany || d.clientName || d.clientEmail}</span>
                    <span className="block text-[12px] text-muted">{d.ref} · {d.recommendedTier ?? "—"} · {formatRelative(d.updatedAt, locale)}</span></span>
                  <Badge tone={STAFF_DOSSIER_STATUSES.includes(d.status) ? "warning" : d.status === "active" ? "success" : "neutral"}>{dossierStatusLabel(d.status, locale)}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </Section>

        <Section title={D.sections.prospects} count={detail.prospects.length} empty={D.empty}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-[13.5px]">
              <thead>
                <tr className="border-y border-line text-[11.5px] uppercase tracking-[0.06em] text-muted">
                  <th className="px-5 py-2 text-start font-medium sm:px-6">{t.dash.prospects.title}</th>
                  <th className="px-3 py-2 text-start font-medium">{D.prospect.contact}</th>
                  <th className="px-3 py-2 text-start font-medium">{D.prospect.stage}</th>
                  <th className="px-3 py-2 text-start font-medium">{D.prospect.next}</th>
                  <th className="px-3 py-2 text-end font-medium">{D.prospect.value}</th>
                  <th className="px-5 py-2 text-start font-medium sm:px-6">{D.prospect.added}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {detail.prospects.map((p) => (
                  <tr key={p.id} className="align-top">
                    <td className="px-5 py-3 sm:px-6">
                      <p className="font-medium">{p.name}</p>
                      <p className="text-[12px] text-muted">{[p.company, p.profession, p.source].filter(Boolean).join(" · ") || "—"}</p>
                      {p.notes && <p className="mt-1 line-clamp-2 max-w-sm text-[12px] text-fg-2" title={p.notes}>{p.notes}</p>}
                    </td>
                    <td className="px-3 py-3 text-[12.5px]">
                      {p.email && <a href={`mailto:${p.email}`} className="block text-accent">{p.email}</a>}
                      {p.phone && <a href={`tel:${p.phone}`} className="block">{p.phone}</a>}
                      {p.website && <a href={/^https?:\/\//.test(p.website) ? p.website : `https://${p.website}`} target="_blank" rel="noreferrer noopener" className="block truncate text-muted">{p.website}</a>}
                      {!p.email && !p.phone && !p.website && <span className="text-muted">—</span>}
                    </td>
                    <td className="px-3 py-3"><Badge tone={p.stage === "won" ? "success" : p.stage === "lost" ? "neutral" : "accent"}>{t.dash.prospects.stages[p.stage]}</Badge></td>
                    <td className="px-3 py-3 text-[12.5px]">{p.nextAction ?? "—"}{p.nextActionAt && <span className="block text-muted">{formatDate(p.nextActionAt, locale, "short")}</span>}</td>
                    <td className="tabular px-3 py-3 text-end">{p.potentialValueCents ? money(p.potentialValueCents) : "—"}</td>
                    <td className="px-5 py-3 text-[12.5px] text-muted sm:px-6">{formatDate(p.createdAt, locale, "short")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title={D.sections.leads} count={detail.leads.length} empty={D.empty}>
          <ul className="divide-y divide-line">
            {detail.leads.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center gap-3 px-5 py-3 sm:px-6">
                <span className="min-w-0 flex-1"><span className="font-medium">{l.fullName}</span>{l.company && <span className="text-muted"> · {l.company}</span>}
                  <span className="block text-[12px] text-muted">{l.email} · {l.profession ?? "—"} · {formatDate(l.createdAt, locale, "short")}</span></span>
                <Badge tone={l.status === "converted" ? "success" : l.status === "new" ? "accent" : "neutral"}>{l.status.replace(/_/g, " ")}</Badge>
              </li>
            ))}
          </ul>
        </Section>

        <div className="grid gap-6 lg:grid-cols-2">
          <Section title={D.sections.sales} count={detail.sales.length} empty={D.empty}>
            <ul className="divide-y divide-line">
              {detail.sales.map((x) => (
                <li key={x.id} className="flex flex-wrap items-center gap-3 px-5 py-3 sm:px-6">
                  <span className="min-w-0 flex-1"><span className="font-medium">{x.customerName ?? x.customerRef}</span>
                    <span className="block text-[12px] text-muted">{x.ref} · {x.kind} · {formatDate(x.date, locale, "short")}</span></span>
                  <Badge tone={saleTone[x.status]}>{t.dash.sales.statuses[x.status]}</Badge>
                  <span className="tabular font-medium">{money(x.amountCents)}</span>
                </li>
              ))}
            </ul>
          </Section>
          <Section title={D.sections.commissions} count={detail.commissions.length} empty={D.empty}>
            <ul className="divide-y divide-line">
              {detail.commissions.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-3 sm:px-6">
                  <span className="min-w-0 flex-1 text-[13px]">{fmt(D.commissionRole, { sale: c.saleRef })}
                    <span className="block text-[12px] text-muted">{c.kind ?? "—"} · {formatDate(c.createdAt, locale, "short")}</span></span>
                  <Badge tone={commissionTone[c.status]}>{t.dash.commissions.statuses[c.status]}</Badge>
                  <span className="tabular font-medium">{money(c.amountCents)}</span>
                </li>
              ))}
            </ul>
          </Section>
        </div>

        <Section title={D.sections.payouts} count={detail.payouts.length} empty={D.empty}>
          <ul className="divide-y divide-line">
            {detail.payouts.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 px-5 py-3 sm:px-6">
                <span className="min-w-0 flex-1 font-medium">{p.ref}<span className="block text-[12px] font-normal text-muted">{formatDate(p.paidAt ?? p.scheduledFor, locale, "short")}</span></span>
                <Badge tone={payoutTone[p.status]}>{t.dash.payouts.statuses[p.status]}</Badge>
                <span className="tabular font-medium">{money(p.amountCents)}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </>
  );
}
