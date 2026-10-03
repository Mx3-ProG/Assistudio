import { Camera, Hammer, Briefcase, Layers, Compass, Store, Building2, UserRound, Factory, ArrowRight } from "lucide-react";
import type { Dictionary } from "@/i18n/types";
import { TrackedLink } from "./tracked-link";

const ICONS: Record<string, typeof Camera> = {
  photographer: Camera, craftsman: Hammer, consultant: Briefcase, agency: Layers, coach: Compass,
  shop: Store, b2b: Building2, independent: UserRound, sme: Factory,
};

/** "Who buys Studio?" — nine everyday profiles, one concrete pain each, so the visitor thinks of a name. */
export function BuyerProfiles({ t, ctaHref }: { t: Dictionary; ctaHref: string }) {
  const B = t.hc.buyers;
  return (
    <>
      {/* Phones: a swipeable row (9 stacked cards would be a wall); larger screens: a grid. */}
      <ul className="no-scrollbar -mx-4 mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:mt-10 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
        {B.profiles.map((p) => {
          const Icon = ICONS[p.key] ?? UserRound;
          return (
            <li key={p.key} className="card flex w-[82%] shrink-0 snap-start gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-md sm:w-auto">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent"><Icon className="size-[18px]" aria-hidden /></span>
              <div className="min-w-0">
                <p className="text-[15px] font-semibold">{p.name}</p>
                <p className="mt-1 text-[14.5px] leading-relaxed text-fg-2">{p.pain}</p>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-8 flex flex-col items-start gap-5 rounded-[24px] border border-accent/25 bg-accent-soft/60 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <p className="max-w-2xl text-[17px] font-medium leading-snug sm:text-[19px]">{B.close}</p>
        <TrackedLink href={ctaHref} event="first_prospect_cta" placement="buyers" className="w-full shrink-0 sm:w-auto">
          {B.cta} <ArrowRight className="flip-rtl size-4" />
        </TrackedLink>
      </div>
    </>
  );
}
