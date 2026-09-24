"use client";
import { useActionState, useState } from "react";
import { Plus, Eye, ExternalLink, Lock } from "lucide-react";
import { useI18n } from "@/components/providers";
import { setSlug, createPrivatePage, type FormState } from "@/app/actions/dashboard";
import { Field, inputClass, Badge } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { locales, localeMeta } from "@/i18n/config";
import { marketContent, type Market } from "@/content/markets";
import type { PrivatePage } from "@/lib/data/types";

export function SlugForm({ current, siteUrl }: { current: string | null; siteUrl: string }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<FormState, FormData>(setSlug, {});
  return (
    <form action={action} className="grid gap-3">
      <Field label={t.dash.link.vanityTitle} hint={state.error ? (state.error === "taken" ? "✕ taken" : "✕ " + t.dash.link.vanityHint) : t.dash.link.vanityHint}>
        <div className="flex items-stretch overflow-hidden rounded-xl border border-line bg-surface focus-within:border-accent">
          <span className="flex items-center bg-surface-2 px-3 font-mono text-[13px] text-muted" dir="ltr">{siteUrl.replace(/^https?:\/\//, "")}/s/</span>
          <input name="slug" defaultValue={current ?? ""} pattern="[a-z0-9][a-z0-9-]{1,30}[a-z0-9]" className="h-11 min-w-0 flex-1 bg-transparent px-3 font-mono text-[14px] outline-none" dir="ltr" />
        </div>
      </Field>
      <button disabled={pending} className={buttonClass("primary", "md", "justify-self-start")}>{state.ok ? t.dash.settings.saved : t.common.save}</button>
    </form>
  );
}

export function PrivatePages({ pages, markets, campaigns, siteUrl }: {
  pages: PrivatePage[]; markets: Market[]; campaigns: { id: string; name: string }[]; siteUrl: string;
}) {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(async (p, f) => {
    const r = await createPrivatePage(p, f);
    if (r.ok) setOpen(false);
    return r;
  }, {});
  const L = t.dash.link.page;
  const select = `${inputClass} appearance-none`;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-[15px] font-semibold"><Lock className="size-4 text-accent" />{t.dash.link.privatePagesTitle}</h2>
          <p className="mt-0.5 text-[13px] text-muted">{t.dash.link.privatePagesSubtitle}</p>
        </div>
        <button onClick={() => setOpen((v) => !v)} className={buttonClass("secondary", "sm")}><Plus className="size-4" />{t.dash.link.newPrivatePage}</button>
      </div>

      {open && (
        <form action={action} className="mt-5 grid gap-4 rounded-2xl bg-surface-2 p-4 sm:grid-cols-2 sm:p-5">
          <Field label={L.market}>
            <select name="marketId" className={select} defaultValue="">
              <option value="">—</option>
              {markets.map((m) => <option key={m.id} value={m.id}>{marketContent(m, locale).name}</option>)}
            </select>
          </Field>
          <Field label={L.locale}>
            <select name="locale" className={select} defaultValue={locale}>
              {locales.map((l) => <option key={l} value={l}>{localeMeta[l].label}</option>)}
            </select>
          </Field>
          <Field label={L.pitch}>
            <select name="pitchVariant" className={select}>
              <option value="default">{L.pitchDefault}</option>
              <option value="premium">{L.pitchPremium}</option>
              <option value="automation">{L.pitchAutomation}</option>
            </select>
          </Field>
          <Field label={L.cta}>
            <select name="ctaVariant" className={select}>
              <option value="request">{L.ctaRequest}</option>
              <option value="call">{L.ctaCall}</option>
            </select>
          </Field>
          <Field label={L.displayName}><input name="displayName" maxLength={60} className={inputClass} /></Field>
          <Field label={L.campaign}>
            <select name="campaignId" className={select} defaultValue="">
              <option value="">—</option>
              {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label={L.visibility}>
            <select name="visibility" className={select}>
              <option value="private">{L.private}</option>
              <option value="unlisted">{L.unlisted}</option>
            </select>
          </Field>
          <div className="flex items-end gap-2">
            <button disabled={pending} className={buttonClass("primary", "md")}>{t.common.create}</button>
            <button type="button" onClick={() => setOpen(false)} className={buttonClass("ghost", "md")}>{t.common.cancel}</button>
          </div>
          {state.error && <p className="text-[13px] text-danger sm:col-span-2">{t.errors.generic}</p>}
        </form>
      )}

      <ul className="mt-5 grid gap-3">
        {pages.map((p) => {
          const url = `${siteUrl}/${p.locale}/p/${p.slug}`;
          const m = markets.find((x) => x.id === p.marketId);
          return (
            <li key={p.id} className="flex flex-col gap-3 rounded-2xl border border-line p-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-[13px]" dir="ltr">/p/{p.slug}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {m && <Badge tone="accent">{marketContent(m, locale).name}</Badge>}
                  <Badge>{localeMeta[p.locale].label}</Badge>
                  <Badge><Eye className="size-3" /> {p.viewCount} {L.views}</Badge>
                  <Badge>noindex</Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <CopyButton value={url} />
                <a href={url} target="_blank" rel="noopener" className={buttonClass("ghost", "sm")}><ExternalLink className="size-4" /></a>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
