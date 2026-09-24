"use client";
import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { updateMarket, type AdminState } from "@/app/actions/admin";
import { useI18n } from "@/components/providers";
import { Field, inputClass, textareaClass, Badge } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";
import { MarketIcon } from "@/components/marketing/markets-grid";
import { locales, localeMeta, type Locale } from "@/i18n/config";
import type { Market } from "@/content/markets";
import { cn } from "@/lib/cn";

export function MarketEditor({ markets, editLocale }: { markets: (Market & { active: boolean })[]; editLocale: Locale }) {
  const { t } = useI18n();
  const router = useRouter();
  const [selected, setSelected] = useState(markets[0]?.id);
  const m = markets.find((x) => x.id === selected);
  const c = m?.content[editLocale];
  const [state, action, pending] = useActionState<AdminState, FormData>(updateMarket, {});

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <ul className="card grid content-start gap-0.5 p-2">
        {markets.map((x) => (
          <li key={x.id}>
            <button onClick={() => setSelected(x.id)} className={cn("flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-start text-[14px]", x.id === selected ? "bg-surface-2 font-medium" : "hover:bg-surface-2/60")}>
              <MarketIcon name={x.icon} className="size-4 text-accent" />
              <span className="flex-1 truncate">{x.content.en.name}</span>
              {!x.active && <Badge>off</Badge>}
            </button>
          </li>
        ))}
      </ul>
      {m && (
        <form key={`${m.id}-${editLocale}`} action={action} className="card grid gap-4 p-5 sm:p-6">
          <input type="hidden" name="id" value={m.id} />
          <div className="flex flex-wrap items-center gap-2">
            {locales.map((l) => (
              <button type="button" key={l} onClick={() => router.push(`?lang=${l}`)}
                className={cn("h-8 rounded-full px-3 text-[12px] font-medium", l === editLocale ? "bg-fg text-bg" : "bg-surface-2 text-fg-2")}>
                {localeMeta[l].label}{!m.content[l] && " ·"}
              </button>
            ))}
            <input type="hidden" name="locale" value={editLocale} />
          </div>
          {!c && <p className="text-[13px] text-warning">No {localeMeta[editLocale].label} content yet — English is shown as fallback. Saving creates the translation.</p>}
          {(["name", "who", "why", "problem", "angle"] as const).map((k) => (
            <Field key={k} label={k}>
              <input name={k} required defaultValue={(c ?? m.content.en)[k]} className={inputClass} />
            </Field>
          ))}
          <Field label="message"><textarea name="message" rows={5} required defaultValue={(c ?? m.content.en).message} className={textareaClass} /></Field>
          <Field label="searches (one per line)"><textarea name="searches" rows={3} defaultValue={(c ?? m.content.en).searches.join("\n")} className={textareaClass} /></Field>
          <label className="flex items-center gap-3 text-[14px]"><input type="checkbox" name="active" defaultChecked={m.active} className="size-4 accent-[var(--accent)]" />Active</label>
          <div className="flex items-center gap-3">
            <button disabled={pending} className={buttonClass("primary", "md")}>{t.common.save}</button>
            {state.ok && <span className="text-[13px] text-success">{t.dash.settings.saved}</span>}
            {state.error && <span className="text-[13px] text-danger">{state.error}</span>}
          </div>
        </form>
      )}
    </div>
  );
}
