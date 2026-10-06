"use client";
import { useActionState } from "react";
import { useI18n } from "@/components/providers";
import { fmt } from "@/i18n/format";
import { formatDate, formatMoney } from "@/lib/money";
import {
  createProofEvent, createTestimonialInvite, recordClientWithdrawal, removeTestimonialMedia, reviewTestimonial,
  revokeTestimonialInvite, saveTestimonialPresentation, setProofEventPublished, type ProofAdminState,
} from "@/app/actions/proof";
import {
  PLACEMENTS, SERVICES, DISPLAY_MODES, PROOF_LIMITS, canSetDisplay, displayName, nextStatuses,
  type AdminProofEvent, type AdminTestimonial, type InviteCandidate, type ProofEventCandidate, type PublicTestimonial, type TestimonialInvite,
} from "@/lib/proof";
import { TestimonialCard } from "@/components/proof/testimonial-card";
import { CopyButton } from "@/components/ui/copy-button";
import { Badge } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";
import { inputClass, textareaClass } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

function useErr() {
  const { t } = useI18n();
  return (s: ProofAdminState) => (s.error ? ((t.pf.admin.errors as Record<string, string>)[s.error] ?? t.pf.admin.errors.generic) : null);
}

/** What the public card will look like (same component as the site). */
const preview = (r: AdminTestimonial): PublicTestimonial => ({
  id: r.id, type: r.type, displayName: displayName(r.authorName, r.displayMode), companyName: r.showCompany ? r.companyName : null,
  profession: r.profession, activity: r.activity, rating: r.rating, content: r.content, recommendation: r.recommendation, locale: r.locale,
  mediaType: r.mediaType, video: r.video, hasPoster: r.hasPoster, hasPhoto: r.hasPhoto, hasLogo: r.hasLogo, service: r.service,
  caseStudyKey: r.caseStudyKey, verified: r.verified, featured: r.featured, publishedOn: (r.reviewedAt ?? r.createdAt).slice(0, 10), proofType: "real",
});

/** One review: original words (read-only), author & consent, moderation, presentation, media. */
export function TestimonialAdmin({ r }: { r: AdminTestimonial }) {
  const { t, locale } = useI18n();
  const A = t.pf.admin;
  const err = useErr();
  const [rs, review, reviewing] = useActionState<ProofAdminState, FormData>(reviewTestimonial, {});
  const [ps, present, presenting] = useActionState<ProofAdminState, FormData>(saveTestimonialPresentation, {});
  const [ms, removeMedia, removing] = useActionState<ProofAdminState, FormData>(removeTestimonialMedia, {});
  const [ws, withdraw, withdrawing] = useActionState<ProofAdminState, FormData>(recordClientWithdrawal, {});
  const labels = { approved: A.approve, rejected: A.reject, hidden: A.hide } as const;
  const confirmIt = (msg: string) => (e: React.MouseEvent) => { if (!window.confirm(msg)) e.preventDefault(); };

  return (
    <article className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[360px_1fr]">
      <div className="min-w-0">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{A.original}</p>
        <TestimonialCard item={preview(r)} />
      </div>

      <div className="grid min-w-0 content-start gap-5">
        <div className="flex flex-wrap items-center gap-2 text-[13px]">
          <Badge tone={r.type === "client" ? "accent" : "neutral"}>{A.from[r.type]}</Badge>
          <span className="font-semibold">{r.authorName}</span>
          <span className="text-muted">{r.ref} · {formatDate(r.createdAt, locale)}</span>
          <span className="text-muted">· {A.account}: {r.authorAccount ?? "—"}</span>
        </div>
        <ul className="grid gap-1 text-[12.5px]">
          <li className={r.verified ? "text-success" : "text-muted"}>{r.verifiedBasis ? A.verifiedBy[r.verifiedBasis] : A.notVerified}</li>
          <li className={r.consentWithdrawn ? "font-semibold text-danger" : "text-fg-2"}>
            {r.consentWithdrawn ? A.consentWithdrawn : fmt(A.consentOn, { date: formatDate(r.consentAt, locale), version: r.consentVersion })}
          </li>
          {!r.consentWithdrawn && <li className="text-muted">“{r.consentText}”</li>}
          {r.reviewNote && <li className="text-muted">{A.reason}: {r.reviewNote}</li>}
        </ul>

        {/* moderation */}
        <form action={review} className="grid gap-2">
          <input type="hidden" name="id" value={r.id} />
          <textarea name="note" rows={2} maxLength={1000} placeholder={A.reason} className={cn(textareaClass, "min-h-14 text-[14px]")} />
          <div className="flex flex-wrap gap-2">
            {nextStatuses(r.status, r.consentWithdrawn).map((st) => (
              <button key={st} name="status" value={st} disabled={reviewing}
                className={buttonClass(st === "approved" ? "accent" : st === "rejected" ? "danger" : "secondary", "md")}>{labels[st]}</button>
            ))}
          </div>
          {err(rs) && <p className="text-[12.5px] text-danger">{err(rs)}</p>}
        </form>

        {/* presentation (approved only) */}
        {r.status === "approved" && (
          <form action={present} className="grid gap-3 rounded-2xl border border-line p-4">
            <p className="text-[13px] font-semibold">{A.presentation}</p>
            <input type="hidden" name="id" value={r.id} />
            <fieldset>
              <legend className="text-[12px] font-medium text-fg-2">{A.placements}</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {PLACEMENTS.map((p) => (
                  <label key={p} className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-line px-3 text-[13px] has-[:checked]:border-accent has-[:checked]:bg-accent-soft has-[:checked]:text-accent">
                    <input type="checkbox" name="placements" value={p} defaultChecked={r.placements.includes(p)} className="accent-[var(--accent)]" />{A.places[p]}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-[12px] font-medium text-fg-2">{A.displayMode}
                <select name="displayMode" defaultValue={r.displayMode} className={cn(inputClass, "mt-1")}>
                  {DISPLAY_MODES.filter((m) => canSetDisplay(r.authorDisplay, m)).map((m) => <option key={m} value={m}>{t.pf.form.display[m]} — {displayName(r.authorName, m)}</option>)}
                </select>
                <span className="mt-1 block font-normal text-muted">{fmt(A.displayLimit, { mode: t.pf.form.display[r.authorDisplay] })}</span>
              </label>
              <label className="block text-[12px] font-medium text-fg-2">{A.service}
                <select name="service" defaultValue={r.service ?? ""} className={cn(inputClass, "mt-1")}>
                  <option value="">{A.none}</option>
                  {SERVICES.map((sv) => <option key={sv} value={sv}>{t.pf.services[sv]}</option>)}
                </select>
              </label>
              <label className="block text-[12px] font-medium text-fg-2">{A.caseStudy}
                <input name="caseStudyKey" defaultValue={r.caseStudyKey ?? ""} pattern="[a-z0-9][a-z0-9\-]{0,60}" className={cn(inputClass, "mt-1")} />
              </label>
              <label className="block text-[12px] font-medium text-fg-2">{A.sort}
                <input name="sort" type="number" defaultValue={r.sort} min={-1000} max={1000} className={cn(inputClass, "mt-1")} />
              </label>
            </div>
            <div className="flex flex-wrap gap-4 text-[13px]">
              <label className="inline-flex items-center gap-2"><input type="checkbox" name="showCompany" defaultChecked={r.showCompany} />{A.showCompany}</label>
              <label className="inline-flex items-center gap-2"><input type="checkbox" name="featured" defaultChecked={r.featured} />{A.featured}</label>
            </div>
            <div className="flex items-center gap-3">
              <button disabled={presenting} className={buttonClass("primary", "md")}>{A.save}</button>
              {ps.ok && <span className="text-[12.5px] text-success">{A.saved}</span>}
              {err(ps) && <span className="text-[12.5px] text-danger">{err(ps)}</span>}
            </div>
          </form>
        )}

        {/* media & consent */}
        <div className="flex flex-wrap gap-2">
          {(["video", "photo", "logo"] as const).filter((k) => (k === "video" ? !!r.video : k === "photo" ? r.hasPhoto : r.hasLogo)).map((k) => (
            <form key={k} action={removeMedia}>
              <input type="hidden" name="id" value={r.id} />
              <button name="kind" value={k} disabled={removing} onClick={confirmIt(A.removeConfirm)} className={buttonClass("ghost", "md", "border border-line text-danger")}>
                {k === "video" ? A.removeVideo : k === "photo" ? A.removePhoto : A.removeLogo}
              </button>
            </form>
          ))}
          {r.type === "client" && !r.consentWithdrawn && (
            <form action={withdraw}>
              <input type="hidden" name="id" value={r.id} />
              <button disabled={withdrawing} onClick={confirmIt(A.recordWithdrawalConfirm)} className={buttonClass("ghost", "md", "border border-line")}>{A.recordWithdrawal}</button>
            </form>
          )}
          {(err(ms) || err(ws)) && <p className="w-full text-[12.5px] text-danger">{err(ms) ?? err(ws)}</p>}
        </div>
      </div>
    </article>
  );
}

/** Staff create a single-use review link for a client (with a paid sale for the verified badge). */
export function InvitePanel({ candidates, invites }: { candidates: InviteCandidate[]; invites: TestimonialInvite[] }) {
  const { t, locale } = useI18n();
  const A = t.pf.admin;
  const err = useErr();
  const [st, create, creating] = useActionState<ProofAdminState, FormData>(createTestimonialInvite, {});
  const [, revoke] = useActionState<ProofAdminState, FormData>(revokeTestimonialInvite, {});
  return (
    <div className="grid gap-6 p-5 sm:p-6">
      <form action={create} className="grid gap-3">
        <p className="text-[15px] font-semibold">{A.inviteTitle}</p>
        <p className="text-[13px] text-muted">{fmt(A.inviteHint, { days: PROOF_LIMITS.inviteDays })}</p>
        {candidates.length === 0 ? <p className="text-[13px] text-muted">{A.noCandidates}</p> : (
          <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr_auto] sm:items-end">
            <label className="block text-[12px] font-medium text-fg-2">{A.customer}
              <select name="customerId" required className={cn(inputClass, "mt-1")}>
                {candidates.map((c) => <option key={c.customerId} value={c.customerId}>{c.companyName ?? c.customerRef} · {c.customerRef} · {c.offer} · {formatDate(c.paidAt, locale)}</option>)}
              </select>
            </label>
            <label className="block text-[12px] font-medium text-fg-2">{A.note}
              <input name="note" maxLength={300} className={cn(inputClass, "mt-1")} />
            </label>
            <input type="hidden" name="locale" value={locale} />
            <button disabled={creating} className={buttonClass("accent", "md")}>{A.createInvite}</button>
          </div>
        )}
        {st.link && (
          <div className="rounded-2xl border border-success/40 bg-success-soft p-4">
            <p className="text-[13px] font-medium text-success">{A.inviteReady}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <code className="min-w-0 flex-1 break-all rounded-lg bg-surface px-2 py-1 text-[12px]">{st.link}</code>
              <CopyButton value={st.link} />
            </div>
          </div>
        )}
        {err(st) && <p className="text-[12.5px] text-danger">{err(st)}</p>}
      </form>
      {invites.length > 0 && (
        <ul className="divide-y divide-line rounded-2xl border border-line">
          {invites.map((i) => (
            <li key={i.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-[13px]">
              <Badge tone={i.state === "open" ? "accent" : i.state === "used" ? "success" : "neutral"}>{A.inviteStates[i.state]}</Badge>
              <span className="font-medium">{i.companyName ?? i.customerRef}</span>
              <span className="text-muted">{i.customerRef} · {formatDate(i.createdAt, locale)} → {formatDate(i.expiresAt, locale)}</span>
              {i.note && <span className="text-muted">· {i.note}</span>}
              {i.state === "open" && (
                <form action={revoke} className="ms-auto"><input type="hidden" name="id" value={i.id} /><button className={buttonClass("ghost", "sm", "text-danger")}>{A.revoke}</button></form>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Proof events: created from a real source, then published / unpublished. */
export function ProofEventsPanel({ events, candidates }: { events: AdminProofEvent[]; candidates: ProofEventCandidate[] }) {
  const { t, locale } = useI18n();
  const A = t.pf.admin;
  const err = useErr();
  const [cs, create, creating] = useActionState<ProofAdminState, FormData>(createProofEvent, {});
  const [ps, publish, publishing] = useActionState<ProofAdminState, FormData>(setProofEventPublished, {});
  const money = (v: number | null, c: string | null) => (v != null && c ? formatMoney(v, locale, c) : null);
  return (
    <div className="grid gap-6 p-5 sm:p-6">
      <div>
        <p className="text-[15px] font-semibold">{A.eventsTitle}</p>
        <p className="mt-1 text-[13px] text-muted">{A.eventsHint}</p>
      </div>
      {events.length > 0 ? (
        <ul className="divide-y divide-line rounded-2xl border border-line">
          {events.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-[13px]">
              <Badge tone={e.published ? "success" : "neutral"}>{e.published ? A.published : A.draft}</Badge>
              <span className="font-medium">{A.types[e.type]}</span>
              {money(e.valueCents, e.currency) && <span className="tabular">{money(e.valueCents, e.currency)}</span>}
              <span className="text-muted">{(t.pf.events.labels as Record<string, string>)[e.label] ?? e.label} · {formatDate(e.occurredAt, locale)}</span>
              {!e.sourceValid && <span className="text-danger">{A.sourceInvalid}</span>}
              <form action={publish} className="ms-auto">
                <input type="hidden" name="id" value={e.id} />
                <button name="published" value={String(!e.published)} disabled={publishing || (!e.published && !e.sourceValid)}
                  className={buttonClass(e.published ? "secondary" : "accent", "sm")}>{e.published ? A.unpublish : A.publish}</button>
              </form>
            </li>
          ))}
        </ul>
      ) : <p className="text-[13px] text-muted">{A.empty}</p>}
      {err(ps) && <p className="text-[12.5px] text-danger">{err(ps)}</p>}

      <div>
        <p className="text-[13px] font-semibold">{A.candidates}</p>
        {candidates.length === 0 ? <p className="mt-2 text-[13px] text-muted">{A.empty}</p> : (
          <ul className="mt-2 divide-y divide-line rounded-2xl border border-line">
            {candidates.slice(0, 40).map((c) => (
              <li key={`${c.type}:${c.sourceId}`} className="flex flex-wrap items-center gap-3 px-4 py-3 text-[13px]">
                <span className="font-medium">{A.types[c.type]}</span>
                <span className="text-muted">{c.ref}</span>
                {money(c.valueCents, c.currency) && <span className="tabular">{money(c.valueCents, c.currency)}</span>}
                <span className="text-muted">{formatDate(c.at, locale)}</span>
                <form action={create} className="ms-auto">
                  <input type="hidden" name="type" value={c.type} /><input type="hidden" name="sourceId" value={c.sourceId} />
                  <button disabled={creating} className={buttonClass("secondary", "sm")}>{A.createEvent}</button>
                </form>
              </li>
            ))}
          </ul>
        )}
        {err(cs) && <p className="mt-2 text-[12.5px] text-danger">{err(cs)}</p>}
      </div>
    </div>
  );
}
