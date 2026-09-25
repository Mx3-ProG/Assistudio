"use client";
import { useActionState, useState } from "react";
import { Lock, Sparkles } from "lucide-react";
import { useI18n } from "@/components/providers";
import { Field, inputClass, Notice } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";
import { locales, localeMeta } from "@/i18n/config";
import { saveSalesPage, type PageFormState } from "@/app/actions/sales-center";
import type { CtaMode } from "@/lib/sales/content";
import type { PrivatePage } from "@/lib/data/types";

export interface BuilderOptions {
  targets: { id: string; slug: string; name: string }[];
  templates: { key: string; title: string; ctaModes: CtaMode[]; defaultCta: CtaMode }[];
  angles: { key: string; title: string; promise: string }[];
  campaigns: { id: string; name: string }[];
  canBuy: boolean;
  advisorEnabled: boolean;
  advisorDefault: string;
}

/** Controlled builder: the affiliate picks among approved blocks; Studio ATS owns price, terms and copy. */
export function PageBuilder({ o, page, initialTargetSlug, onDone }: {
  o: BuilderOptions; page?: PrivatePage | null; initialTargetSlug?: string | null; onDone?: () => void;
}) {
  const { t, locale } = useI18n();
  const P = t.sc.pages;
  const initialTarget = page ? o.targets.find((x) => x.id === page.marketId) : o.targets.find((x) => x.slug === initialTargetSlug);
  const [marketId, setMarketId] = useState(initialTarget?.id ?? "");
  const [path, setPath] = useState(page?.pathKey ?? initialTarget?.slug ?? "general");
  const [templateKey, setTemplateKey] = useState(page?.templateKey ?? o.templates[0]?.key ?? "");
  const tpl = o.templates.find((x) => x.key === templateKey);
  const [cta, setCta] = useState<CtaMode>(page?.ctaMode ?? tpl?.defaultCta ?? "lead");
  const [advisor, setAdvisor] = useState(page?.showAdvisor ?? o.advisorEnabled);
  const [state, action, pending] = useActionState<PageFormState, FormData>(async (prev, f) => {
    const r = await saveSalesPage(prev, f);
    if (r.ok) onDone?.();
    return r;
  }, {});
  const select = `${inputClass} appearance-none`;

  return (
    <form action={action} className="grid gap-5">
      {page && <input type="hidden" name="id" value={page.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={P.target}>
          <select name="marketId" className={select} value={marketId} onChange={(e) => {
            setMarketId(e.target.value);
            if (!page) setPath(o.targets.find((x) => x.id === e.target.value)?.slug ?? "general");
          }}>
            <option value="">{P.general}</option>
            {o.targets.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
        </Field>
        <Field label={P.angle}>
          <select name="angleKey" className={select} defaultValue={page?.angleKey ?? ""}>
            <option value="">{P.angleDefault}</option>
            {o.angles.map((a) => <option key={a.key} value={a.key}>{a.title}</option>)}
          </select>
        </Field>
        <Field label={P.cta}>
          <select name="ctaMode" className={select} value={cta} onChange={(e) => setCta(e.target.value as CtaMode)}>
            {(tpl?.ctaModes ?? ["lead"]).map((m) => <option key={m} value={m}>{P.ctaModes[m]}</option>)}
          </select>
        </Field>
        <Field label={P.language}>
          <select name="locale" className={select} defaultValue={page?.locale ?? locale}>
            {locales.map((l) => <option key={l} value={l}>{localeMeta[l].label}</option>)}
          </select>
        </Field>
        {o.templates.length > 1 ? (
          <Field label={t.sc.kinds.page_template}>
            <select name="templateKey" className={select} value={templateKey} onChange={(e) => setTemplateKey(e.target.value)}>
              {o.templates.map((x) => <option key={x.key} value={x.key}>{x.title}</option>)}
            </select>
          </Field>
        ) : <input type="hidden" name="templateKey" value={templateKey} />}
        <Field label={P.path} hint={P.pathHint}>
          <input name="pathKey" value={path} onChange={(e) => setPath(e.target.value.toLowerCase())} required pattern="[a-z0-9][a-z0-9-]{0,39}"
            className={`${inputClass} font-mono`} dir="ltr" disabled={!marketId} />
          {!marketId && <input type="hidden" name="pathKey" value="general" />}
        </Field>
        {o.campaigns.length > 0 && (
          <Field label={t.dash.campaigns.title}>
            <select name="campaignId" className={select} defaultValue={page?.campaignId ?? ""}>
              <option value="">—</option>
              {o.campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        )}
      </div>
      {cta === "buy" && !o.canBuy && <Notice tone="warning">{P.ctaUnavailable}</Notice>}

      {o.advisorEnabled && (
        <fieldset className="grid gap-4 rounded-2xl border border-line p-4">
          <label className="flex items-center gap-3 text-[14px] font-medium">
            <input type="checkbox" name="showAdvisor" checked={advisor} onChange={(e) => setAdvisor(e.target.checked)} className="size-4 accent-[var(--accent)]" />
            {P.advisor}
          </label>
          {advisor && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={P.advisorName}><input name="advisorName" maxLength={80} defaultValue={page?.advisor.name ?? o.advisorDefault} className={inputClass} /></Field>
              <Field label={P.advisorTitle}><input name="advisorTitle" maxLength={80} defaultValue={page?.advisor.title ?? ""} className={inputClass} /></Field>
              <Field label={P.advisorEmail}><input name="advisorEmail" type="email" maxLength={200} defaultValue={page?.advisor.email ?? ""} className={inputClass} /></Field>
              <Field label={P.advisorPhone}><input name="advisorPhone" type="tel" maxLength={40} defaultValue={page?.advisor.phone ?? ""} className={inputClass} /></Field>
            </div>
          )}
          <p className="text-[12px] text-muted">{P.advisorNote}</p>
        </fieldset>
      )}

      <div className="rounded-2xl bg-surface-2 p-4 text-[13px]">
        <p className="flex items-center gap-2 font-semibold"><Lock className="size-3.5 text-muted" />{P.brandControlled}</p>
        <p className="mt-1 text-muted">{P.brandItems.join(" · ")}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button disabled={pending || !templateKey} className={buttonClass("accent", "lg")}><Sparkles className="size-4" />{page ? P.save : P.generate}</button>
        {state.error && <span className="text-[13px] text-danger">{P.errors[state.error as keyof typeof P.errors] ?? P.errors.generic}</span>}
      </div>
    </form>
  );
}
