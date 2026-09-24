"use client";
import { useState } from "react";
import { Target } from "lucide-react";
import { useI18n } from "@/components/providers";
import { setGoal } from "@/app/actions/dashboard";
import { Progress, inputClass } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";
import { fmt } from "@/i18n/format";

export function GoalCard({ target, current, commissionPerSaleCents }: { target: number | null; current: number; commissionPerSaleCents: number }) {
  const { t, locale } = useI18n();
  const [editing, setEditing] = useState(false);
  const g = t.dash.goal;

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold"><Target className="size-4 text-accent" />{g.title}</h2>
        {!editing && <button onClick={() => setEditing(true)} className="text-[13px] text-accent hover:underline">{target ? g.edit : g.set}</button>}
      </div>
      {editing ? (
        <form action={async (f) => { await setGoal(f); setEditing(false); }} className="mt-4 flex gap-2">
          <input name="target" type="number" min={1} max={1000} defaultValue={target ?? 3} className={inputClass} aria-label={g.title} />
          <button className={buttonClass("primary", "md")}>{t.common.save}</button>
        </form>
      ) : target ? (
        <>
          <div className="mt-4 flex items-baseline justify-between text-[14px]">
            <span className="text-fg-2">{fmt(g.current, { n: current })}</span>
            <span className="text-muted">{fmt(g.target, { n: target })}</span>
          </div>
          <Progress value={current} max={target} className="mt-2.5" />
          <p className="mt-4 text-[13px] text-muted">
            {g.potential}: <span className="tabular font-semibold text-fg">{formatMoney(target * commissionPerSaleCents, locale)}</span>
          </p>
        </>
      ) : (
        <p className="mt-3 text-[14px] text-muted">{g.none}</p>
      )}
    </div>
  );
}
