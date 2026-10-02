import Link from "next/link";
import type { Dictionary } from "@/i18n/types";
import type { Locale } from "@/i18n/config";
import type { HelpRequest } from "@/lib/data/types";
import { formatMoney, formatRelative } from "@/lib/money";
import { Badge } from "@/components/ui/primitives";
import { helpTone } from "@/components/help/tone";
import { HelpStatusForm } from "./help-status";
import { MessageMemberButton } from "@/components/messaging/conversation-sidebar";

const CTX_KEYS = [
  "affiliate_status", "code", "sponsor", "recruits", "prospects", "leads", "paid_sales",
  "revenue_cents", "available_cents", "paid_cents", "pending_cents", "open_dossiers", "open_requests",
] as const;

/** One help request as staff see it: message, factual snapshot, related records and the next action. */
export function HelpRequestCard({ r, t, locale, profileId, showPartner = true }: {
  r: HelpRequest; t: Dictionary; locale: Locale; profileId?: string; showPartner?: boolean;
}) {
  const A = t.net.admin;
  const ctx = r.context ?? {};
  const value = (k: (typeof CTX_KEYS)[number]) => {
    const v = ctx[k];
    if (v === null || v === undefined || v === "") return null;
    if (k.endsWith("_cents")) return formatMoney(Number(v), locale);
    if (k === "affiliate_status") return t.admin.affiliateStatuses[v as keyof typeof t.admin.affiliateStatuses] ?? String(v);
    return String(v);
  };
  const prospect = ctx.prospect as Record<string, string | null> | undefined;
  const dossier = ctx.dossier as Record<string, string | null> | undefined;
  const base = `/${locale}/admin`;

  return (
    <article className="grid gap-3 px-5 py-5 sm:px-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={helpTone[r.status]}>{t.net.statuses[r.status]}</Badge>
        {r.urgency === "high" && <Badge tone="danger">{t.net.urgencies.high}</Badge>}
        <Badge>{t.net.categories[r.category]}</Badge>
        <span className="text-[12px] text-muted">{r.ref} · {formatRelative(r.createdAt, locale)}</span>
      </div>
      <div>
        <p className="font-semibold">{r.subject}</p>
        {showPartner && (
          <p className="text-[13px] text-muted">
            <Link href={`${base}/network/${r.affiliateId}`} className="text-accent">{r.affiliateName}</Link> · {r.affiliateEmail}
          </p>
        )}
        <p className="mt-2 whitespace-pre-line text-[14px] text-fg-2">{r.message}</p>
      </div>
      {(prospect || dossier || r.pagePath) && (
        <dl className="grid gap-1 text-[13px]">
          {prospect && (
            <div className="flex flex-wrap gap-x-2"><dt className="text-muted">{t.net.ctx.prospect}</dt>
              <dd>{[prospect.name, prospect.company, prospect.stage ? t.dash.prospects.stages[prospect.stage as keyof typeof t.dash.prospects.stages] ?? prospect.stage : null, prospect.email, prospect.phone].filter(Boolean).join(" · ")}</dd>
            </div>
          )}
          {dossier && (
            <div className="flex flex-wrap gap-x-2"><dt className="text-muted">{t.net.ctx.dossier}</dt>
              <dd>{r.dossierId ? <Link href={`${base}/contracts/${r.dossierId}`} className="text-accent">{dossier.ref}</Link> : dossier.ref} · {dossier.client} · {dossier.status}</dd>
            </div>
          )}
          {r.pagePath && <div className="flex flex-wrap gap-x-2"><dt className="text-muted">{A.from}</dt><dd className="font-mono text-[12px]">{r.pagePath}</dd></div>}
        </dl>
      )}
      <details className="rounded-xl bg-surface-2 px-3 py-2 text-[13px]">
        <summary className="cursor-pointer font-medium">{A.context}</summary>
        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
          {CTX_KEYS.map((k) => {
            const v = value(k);
            return v === null ? null : (
              <div key={k}><dt className="text-[11.5px] text-muted">{t.net.ctx[k]}</dt><dd className="tabular">{v}</dd></div>
            );
          })}
        </dl>
      </details>
      {r.staffNote && (r.status === "resolved" || r.status === "closed") && (
        <p className="text-[13px]"><span className="font-medium">{A.teamNote} · </span><span className="whitespace-pre-line text-fg-2">{r.staffNote}</span></p>
      )}
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1"><HelpStatusForm id={r.id} status={r.status} note={r.staffNote} /></div>
        <div className="flex flex-wrap gap-2">
          {profileId && <MessageMemberButton profileId={profileId} base={`${base}/messages`} />}
          {showPartner && <Link href={`${base}/network/${r.affiliateId}`} className="inline-flex h-8 items-center rounded-full border border-line px-3 text-[12.5px] font-medium hover:bg-surface-2">{A.partner}</Link>}
        </div>
      </div>
    </article>
  );
}
