"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { UserRound } from "lucide-react";
import { useI18n } from "@/components/providers";
import { Field, inputClass } from "@/components/ui/primitives";
import { personalize as fill, type Vars, type Variable } from "@/lib/sales/personalize";

const KEY = "studio-sc-vars";
type Ctx = { vars: Vars; set: (k: Variable, v: string) => void };
const PersonalizeContext = createContext<Ctx | null>(null);

/**
 * Prospect values typed by the affiliate, kept for this browser tab only
 * (sessionStorage): the prospect's details are never sent to the server here.
 * Affiliate values (name, link) are prefilled from the session.
 */
export function PersonalizeProvider({ defaults, children }: { defaults: Vars; children: React.ReactNode }) {
  const [vars, setVars] = useState<Vars>(defaults);
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(KEY) ?? "{}") as Vars;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from per-tab storage after mount
      setVars((v) => ({ ...v, ...saved, affiliateUrl: defaults.affiliateUrl, advisorName: saved.advisorName || defaults.advisorName }));
    } catch {}
  }, [defaults.affiliateUrl, defaults.advisorName]);
  const set = (k: Variable, v: string) =>
    setVars((cur) => {
      const next = { ...cur, [k]: v };
      try {
        const { firstName, company, sector, advisorName, campaign } = next;
        sessionStorage.setItem(KEY, JSON.stringify({ firstName, company, sector, advisorName, campaign }));
      } catch {}
      return next;
    });
  return <PersonalizeContext.Provider value={{ vars, set }}>{children}</PersonalizeContext.Provider>;
}

export function usePersonalize() {
  const ctx = useContext(PersonalizeContext);
  const { t } = useI18n();
  return {
    vars: ctx?.vars ?? {},
    set: ctx?.set ?? (() => undefined),
    apply: (template: string) => fill(template, ctx?.vars ?? {}, t.sc.messages.vars),
  };
}

export function PersonalizePanel({ fields = ["firstName", "company", "sector", "advisorName"] }: { fields?: Variable[] }) {
  const { t } = useI18n();
  const { vars, set } = usePersonalize();
  const M = t.sc.messages;
  return (
    <details className="card group p-4 sm:p-5" open>
      <summary className="flex cursor-pointer list-none items-center gap-2 text-[14px] font-semibold">
        <UserRound className="size-4 text-accent" />{M.personalise}
        <span className="ms-auto text-[12px] font-normal text-muted group-open:hidden">{M.personaliseHint}</span>
      </summary>
      <p className="mt-1 text-[12px] text-muted">{M.personaliseHint}</p>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {fields.map((f) => (
          <Field key={f} label={M.vars[f]}>
            <input value={vars[f] ?? ""} onChange={(e) => set(f, e.target.value)} className={inputClass} autoComplete="off" />
          </Field>
        ))}
      </div>
    </details>
  );
}
