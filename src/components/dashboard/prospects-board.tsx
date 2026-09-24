"use client";
import { useActionState, useEffect, useMemo, useOptimistic, useRef, useState, useTransition } from "react";
import { useStored } from "@/lib/hooks/use-stored";
import { Plus, Search, LayoutGrid, List, X, Trash2, Clock, Upload, Lock } from "lucide-react";
import { useI18n } from "@/components/providers";
import { createProspect, updateProspect, moveProspect, deleteProspect, type FormState } from "@/app/actions/dashboard";
import { Field, inputClass, textareaClass, Badge } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";
import { formatMoney, formatDate, formatRelative } from "@/lib/money";
import { PROSPECT_STAGES, type Prospect, type ProspectStage } from "@/lib/data/types";
import { marketContent, type Market } from "@/content/markets";
import { cn } from "@/lib/cn";
import { NextAction } from "@/components/sales-center/next-action";
import { DEFAULT_RULES, type Rules } from "@/lib/sales/next-action";

const STAGE_TONE: Record<ProspectStage, "neutral" | "accent" | "success" | "warning" | "danger"> = {
  new: "neutral", contacted: "accent", replied: "accent", qualified: "accent", interested: "accent", appointment: "warning", proposal: "warning", checkout: "warning", won: "success", lost: "danger",
};

export function ProspectsBoard({ prospects, markets, campaigns, defaultValueCents, rules = DEFAULT_RULES, now, initialNew = false, initialMarketId = null }: {
  prospects: Prospect[]; markets: Market[]; campaigns: { id: string; name: string }[]; defaultValueCents: number;
  rules?: Rules; now: number; initialNew?: boolean; initialMarketId?: string | null;
}) {
  const slugOf = (id: string | null) => markets.find((m) => m.id === id)?.slug ?? null;
  const { t, locale } = useI18n();
  const P = t.dash.prospects;
  const [storedView, setStoredView] = useStored("studio-prospects-view", "board");
  const view = storedView === "list" ? "list" : "board";
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Prospect | "new" | null>(initialNew ? "new" : null);
  const [, startTransition] = useTransition();
  const [optimistic, applyMove] = useOptimistic(prospects, (list, m: { id: string; stage: ProspectStage }) =>
    list.map((p) => (p.id === m.id ? { ...p, stage: m.stage } : p)),
  );

  const changeView = (v: "board" | "list") => setStoredView(v);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return optimistic;
    return optimistic.filter((p) => [p.name, p.company, p.profession, p.email, p.notes].some((v) => v?.toLowerCase().includes(s)));
  }, [optimistic, q]);

  const move = (id: string, stage: ProspectStage) =>
    startTransition(async () => {
      applyMove({ id, stage });
      await moveProspect(id, stage);
    });

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.common.search} className={cn(inputClass, "ps-10")} />
        </div>
        <div className="flex gap-2">
          <div className="inline-flex rounded-full bg-surface-2 p-0.5">
            {(["board", "list"] as const).map((v) => (
              <button key={v} onClick={() => changeView(v)} aria-pressed={view === v}
                className={cn("flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium", view === v ? "bg-surface shadow-sm" : "text-muted")}>
                {v === "board" ? <LayoutGrid className="size-4" /> : <List className="size-4" />}
                <span className="hidden sm:inline">{v === "board" ? P.board : P.list}</span>
              </button>
            ))}
          </div>
          <button onClick={() => setEditing("new")} className={buttonClass("primary", "md", "flex-1 sm:flex-none")}><Plus className="size-4" />{P.new}</button>
        </div>
      </div>

      {view === "board" ? (
        <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
          {PROSPECT_STAGES.map((stage) => {
            const items = filtered.filter((p) => p.stage === stage);
            const total = items.reduce((a, p) => a + (p.potentialValueCents ?? 0), 0);
            return (
              <section
                key={stage}
                className="flex w-[78vw] max-w-[300px] shrink-0 snap-start flex-col rounded-2xl bg-surface-2/70 p-2 sm:w-[280px]"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const id = e.dataTransfer.getData("text/prospect");
                  if (id) move(id, stage);
                }}
              >
                <header className="flex items-center justify-between px-2 pb-2 pt-1">
                  <span className="flex items-center gap-2 text-[13px] font-semibold">
                    <Badge tone={STAGE_TONE[stage]}>{P.stages[stage]}</Badge>
                    <span className="tabular text-muted">{items.length}</span>
                  </span>
                  {total > 0 && <span className="tabular text-[11px] text-muted">{formatMoney(total, locale, "EUR", { compact: true })}</span>}
                </header>
                <ul className="grid min-h-24 gap-2">
                  {items.map((p) => (
                    <li key={p.id}>
                      <article
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData("text/prospect", p.id)}
                        className="card cursor-grab p-3 transition hover:shadow-md active:cursor-grabbing"
                      >
                        <button onClick={() => setEditing(p)} className="block w-full text-start">
                          <p className="truncate text-[14px] font-medium">{p.name}</p>
                          {(p.company || p.profession) && <p className="truncate text-[12px] text-muted">{[p.company, p.profession].filter(Boolean).join(" · ")}</p>}
                          {p.nextAction && (
                            <p className="mt-2 flex items-center gap-1.5 text-[12px] text-fg-2">
                              <Clock className="size-3 shrink-0 text-accent" />
                              <span className="truncate">{p.nextAction}</span>
                              {p.nextActionAt && <span className="shrink-0 text-muted">· {formatRelative(p.nextActionAt, locale)}</span>}
                            </p>
                          )}
                          <NextAction compact prospect={p} rules={rules} now={now} targetSlug={slugOf(p.marketId)} />
                        </button>
                        <select
                          aria-label={P.moveTo}
                          value={p.stage}
                          onChange={(e) => move(p.id, e.target.value as ProspectStage)}
                          className="mt-2 h-7 w-full rounded-lg bg-surface-2 px-2 text-[12px] text-fg-2 outline-none"
                        >
                          {PROSPECT_STAGES.map((s) => <option key={s} value={s}>{P.moveTo}: {P.stages[s]}</option>)}
                        </select>
                      </article>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <ul className="divide-y divide-line">
            {filtered.length === 0 && <li className="p-10 text-center text-muted">{P.empty}</li>}
            {filtered.map((p) => (
              <li key={p.id}>
                <button onClick={() => setEditing(p)} className="flex w-full items-center gap-3 px-4 py-3 text-start hover:bg-surface-2/50 sm:px-5">
                  <div className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-2 text-[13px] font-semibold">{p.name[0]}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium">{p.name}</p>
                    <p className="truncate text-[12px] text-muted">{[p.company, p.profession, p.source].filter(Boolean).join(" · ")}</p>
                  </div>
                  <span className="hidden text-[12px] text-muted sm:block">{p.nextAction}</span>
                  <Badge tone={STAGE_TONE[p.stage]}>{P.stages[p.stage]}</Badge>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-muted">
        <span className="flex items-center gap-1.5"><Lock className="size-3.5" />{P.privacyNote}</span>
        <span className="flex items-center gap-1.5"><Upload className="size-3.5" />{P.csvSoon}</span>
      </p>

      {editing && (
        <ProspectDialog
          prospect={editing === "new" ? null : editing}
          initialMarketId={initialMarketId}
          nextAction={editing !== "new" ? <NextAction prospect={editing} rules={rules} now={now} targetSlug={slugOf(editing.marketId)} /> : null}
          markets={markets}
          campaigns={campaigns}
          defaultValueCents={defaultValueCents}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function ProspectDialog({ prospect, markets, campaigns, defaultValueCents, onClose, nextAction, initialMarketId }: {
  prospect: Prospect | null; markets: Market[]; campaigns: { id: string; name: string }[]; defaultValueCents: number; onClose: () => void;
  nextAction?: React.ReactNode; initialMarketId?: string | null;
}) {
  const { t, locale } = useI18n();
  const F = t.dash.prospects.fields;
  const ref = useRef<HTMLDialogElement>(null);
  const [state, action, pending] = useActionState<FormState, FormData>(async (prev, form) => {
    const r = prospect ? await updateProspect(prev, form) : await createProspect(prev, form);
    if (r.ok) onClose();
    return r;
  }, {});
  const [, startTransition] = useTransition();

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  const local = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");
  const bad = (k: string) => state.error?.split(",").includes(k);
  const select = `${inputClass} appearance-none`;

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto w-[min(640px,calc(100vw-16px))] max-h-[92dvh] rounded-[24px] border border-line bg-bg-elevated p-0 text-fg shadow-lift backdrop:bg-black/40 backdrop:backdrop-blur-sm"
    >
      <form action={action} className="p-5 sm:p-7">
        {prospect && <input type="hidden" name="id" value={prospect.id} />}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[20px] font-semibold tracking-tight">{prospect ? prospect.name : t.dash.prospects.new}</h2>
          <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full bg-surface-2" aria-label={t.common.close}><X className="size-4" /></button>
        </div>
        {nextAction && <div className="mb-5">{nextAction}</div>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={F.name}><input name="name" required defaultValue={prospect?.name} className={cn(inputClass, bad("name") && "border-danger")} autoFocus /></Field>
          <Field label={F.company}><input name="company" defaultValue={prospect?.company ?? ""} className={inputClass} /></Field>
          <Field label={F.profession}><input name="profession" defaultValue={prospect?.profession ?? ""} className={inputClass} /></Field>
          <Field label={F.stage}>
            <select name="stage" defaultValue={prospect?.stage ?? "new"} className={select}>
              {PROSPECT_STAGES.map((s) => <option key={s} value={s}>{t.dash.prospects.stages[s]}</option>)}
            </select>
          </Field>
          <Field label={F.email}><input name="email" type="email" defaultValue={prospect?.email ?? ""} className={cn(inputClass, bad("email") && "border-danger")} /></Field>
          <Field label={F.phone}><input name="phone" type="tel" defaultValue={prospect?.phone ?? ""} className={inputClass} /></Field>
          <Field label={F.website}><input name="website" defaultValue={prospect?.website ?? ""} className={inputClass} /></Field>
          <Field label={F.source}><input name="source" defaultValue={prospect?.source ?? ""} className={inputClass} /></Field>
          <Field label={F.nextAction}><input name="nextAction" defaultValue={prospect?.nextAction ?? ""} className={inputClass} /></Field>
          <Field label={F.nextActionAt}><input name="nextActionAt" type="datetime-local" defaultValue={local(prospect?.nextActionAt ?? null)} className={inputClass} /></Field>
          <Field label={`${F.value} (€)`}>
            <input name="potentialValue" type="number" min={0} step="1" defaultValue={((prospect?.potentialValueCents ?? defaultValueCents) / 100).toString()} className={inputClass} />
          </Field>
          <Field label={F.campaign}>
            <select name="campaignId" defaultValue={prospect?.campaignId ?? ""} className={select}>
              <option value="">—</option>
              {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label={t.dash.link.page.market} className="sm:col-span-2">
            <select name="marketId" defaultValue={prospect?.marketId ?? initialMarketId ?? ""} className={select}>
              <option value="">—</option>
              {markets.map((m) => <option key={m.id} value={m.id}>{marketContent(m, locale).name}</option>)}
            </select>
          </Field>
          <Field label={F.notes} className="sm:col-span-2"><textarea name="notes" rows={3} defaultValue={prospect?.notes ?? ""} className={textareaClass} /></Field>
        </div>
        {prospect && <p className="mt-4 text-[12px] text-muted">{F.created}: {formatDate(prospect.createdAt, locale)}</p>}
        <div className="mt-6 flex items-center justify-between gap-2">
          {prospect ? (
            <button type="button" onClick={() => startTransition(async () => { await deleteProspect(prospect.id); onClose(); })} className={buttonClass("danger", "md")}>
              <Trash2 className="size-4" />{t.common.delete}
            </button>
          ) : <span />}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className={buttonClass("ghost", "md")}>{t.common.cancel}</button>
            <button disabled={pending} className={buttonClass("primary", "md")}>{pending ? t.common.saving : t.common.save}</button>
          </div>
        </div>
      </form>
    </dialog>
  );
}
