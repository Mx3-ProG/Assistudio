"use client";
import { useState } from "react";
import { ArrowRight, UserPlus, Search } from "lucide-react";
import { useI18n } from "@/components/providers";
import { Field, inputClass } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";
import { startProspect } from "@/app/actions/guided";
import { cn } from "@/lib/cn";

export interface FindSource { key: string; title: string; how: string; action: string; tip?: string }

/**
 * "Do you already have someone in mind?" — Yes: four questions, then the
 * prospect's guided page. Not yet: where to find the first three people.
 */
export function FirstSaleStarter({ sectors, sources, initial = "ask", initialSector = "" }: {
  sectors: { slug: string; name: string }[]; sources: FindSource[]; initial?: "ask" | "yes" | "no"; initialSector?: string;
}) {
  const { t, locale } = useI18n();
  const H = t.gd.home;
  const F = H.form;
  const [mode, setMode] = useState<"ask" | "yes" | "no">(initial);
  const choice = (m: "yes" | "no", label: string, Icon: typeof UserPlus) => (
    <button onClick={() => setMode(m)} aria-pressed={mode === m}
      className={cn("flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl border text-[16px] font-semibold transition",
        mode === m ? "border-accent bg-accent text-accent-fg" : "border-line bg-surface hover:bg-surface-2")}>
      <Icon className="size-5" />{label}
    </button>
  );
  return (
    <div className="grid gap-4">
      <p className="text-[17px] font-medium">{H.ask}</p>
      <div className="flex gap-2 sm:max-w-md">{choice("yes", H.yes, UserPlus)}{choice("no", H.no, Search)}</div>

      {mode === "yes" && (
        <form action={startProspect} className="grid gap-4 rounded-2xl bg-surface-2/60 p-4 sm:p-5">
          <input type="hidden" name="locale" value={locale} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={F.name}><input name="name" required minLength={2} maxLength={120} placeholder={F.namePlaceholder} className={inputClass} autoFocus /></Field>
            <Field label={F.sector}>
              <select name="sector" defaultValue={initialSector} className={`${inputClass} appearance-none`}>
                <option value="">—</option>
                {sectors.map((x) => <option key={x.slug} value={x.slug}>{x.name}</option>)}
              </select>
            </Field>
          </div>
          <fieldset>
            <legend className="mb-2 text-[13px] font-medium">{F.relation}</legend>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(F.relations) as (keyof typeof F.relations)[]).map((k, i) => (
                <label key={k} className="cursor-pointer">
                  <input type="radio" name="relation" value={k} defaultChecked={i === 1} className="peer sr-only" />
                  <span className="inline-flex h-9 items-center rounded-full border border-line px-3.5 text-[13.5px] peer-checked:border-accent peer-checked:bg-accent-soft peer-focus-visible:ring-2 peer-focus-visible:ring-accent">{F.relations[k]}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-[13px] font-medium">{F.state}</legend>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(F.states) as (keyof typeof F.states)[]).map((k, i) => (
                <label key={k} className="cursor-pointer">
                  <input type="radio" name="state" value={k} defaultChecked={i === 0} className="peer sr-only" />
                  <span className="inline-flex h-9 items-center rounded-full border border-line px-3.5 text-[13.5px] peer-checked:border-accent peer-checked:bg-accent-soft peer-focus-visible:ring-2 peer-focus-visible:ring-accent">{F.states[k]}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <button className={buttonClass("accent", "lg", "justify-self-start")}>{F.submit}<ArrowRight className="flip-rtl size-4" /></button>
        </form>
      )}

      {mode === "no" && (
        <div className="grid gap-3">
          <div>
            <p className="text-[17px] font-semibold">{H.find.title}</p>
            <p className="text-[14px] text-muted">{H.find.subtitle}</p>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {sources.map((x) => (
              <li key={x.key} className="rounded-2xl border border-line bg-surface p-4">
                <p className="font-semibold">{x.title}</p>
                <p className="mt-1 text-[13.5px] text-fg-2">{x.how}</p>
                <p className="mt-2 text-[13.5px] font-medium text-accent">→ {x.action}</p>
                {x.tip && <p className="mt-1 text-[12.5px] text-muted">{x.tip}</p>}
              </li>
            ))}
          </ul>
          <button onClick={() => setMode("yes")} className={buttonClass("accent", "lg", "justify-self-start")}><UserPlus className="size-4" />{H.find.found}</button>
        </div>
      )}
    </div>
  );
}
