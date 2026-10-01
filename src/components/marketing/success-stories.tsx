import type { Dictionary } from "@/i18n/types";
import type { Locale } from "@/i18n/config";
import { computeCommissionCents } from "@/lib/commission";
import { Money } from "@/components/ui/money";

const STORY_AVATARS = [
  { emoji: "🧑‍🎨", gradient: "from-blue-500 to-violet-500" },
  { emoji: "👩‍💼", gradient: "from-violet-500 to-fuchsia-500" },
  { emoji: "🏠", gradient: "from-cyan-500 to-blue-500" },
  { emoji: "👩‍🎓", gradient: "from-fuchsia-500 to-rose-500" },
  { emoji: "🚀", gradient: "from-indigo-500 to-blue-500" },
  { emoji: "👩‍💻", gradient: "from-purple-500 to-indigo-500" },
  { emoji: "🤝", gradient: "from-blue-500 to-cyan-500" },
] as const;

function MoneyText({ template, values }: { template: string; values: Record<string, number> }) {
  return <>{template.split(/(\{\w+\})/g).map((part, index) => {
    const key = part.startsWith("{") ? part.slice(1, -1) : "";
    return key in values ? <Money key={`${key}-${index}`} cents={values[key]} /> : part;
  })}</>;
}

/**
 * Seven illustrative partner scenarios. Every amount is computed from the
 * offer (sales × commission) — the copy only carries the number of sales.
 * Each card is labelled as illustrative: these are not customer testimonials.
 */
export function SuccessStories({ t, priceCents, rate }: { t: Dictionary; locale: Locale; priceCents: number; rate: number }) {
  const H = t.home;
  const commission = computeCommissionCents(priceCents, rate);

  return (
    <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {H.stories.map((s, i) => {
        const total = s.sales * commission;
        const suffix = s.period === "month" ? ` ${H.storiesPerMonth}` : s.period === "year" ? ` ${H.storiesPerYear}` : "";
        const avatar = STORY_AVATARS[i % STORY_AVATARS.length];
        return (
          <li key={s.name} className={`card flex flex-col p-6 sm:p-7 ${i === 6 ? "sm:col-span-2 lg:col-span-1" : ""}`}>
            <div className="flex items-center gap-3">
              <span aria-hidden className={`grid size-11 shrink-0 place-items-center rounded-full bg-gradient-to-br ${avatar.gradient} text-[23px] shadow-sm ring-1 ring-white/20`}>
                {avatar.emoji}
              </span>
              <div className="min-w-0">
                <p className="text-[15px] font-semibold">{s.name}</p>
                <p className="truncate text-[12px] text-muted">{s.role}</p>
              </div>
            </div>
            <h3 className="mt-5 text-[19px] font-semibold leading-snug tracking-[-0.02em]">{s.title}</h3>
            <p className="mt-2 flex-1 text-[14px] leading-relaxed text-fg-2">
              <MoneyText template={s.body} values={{ commission, total }} />
            </p>
            <div className="mt-5 rounded-2xl bg-surface-2 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{H.storiesMath}</p>
              <p className="tabular mt-1 text-[14px] text-fg-2">
                {s.sales} × <Money cents={commission} /> ={" "}
                <Money cents={total} className="text-[20px] font-semibold tracking-[-0.02em] text-fg" />
                <span className="text-muted">{suffix}</span>
              </p>
              {s.period === "month" && (
                <p className="tabular mt-0.5 text-[12px] text-muted"><MoneyText template={H.storiesYearly} values={{ amount: total * 12 }} /></p>
              )}
            </div>
            <p className="mt-3 text-[11px] font-medium text-muted">{H.storiesBadge}</p>
          </li>
        );
      })}
    </ul>
  );
}
