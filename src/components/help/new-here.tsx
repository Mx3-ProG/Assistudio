"use client";
import { Check, Compass, X } from "lucide-react";
import { useI18n } from "@/components/providers";
import { fmt } from "@/i18n/format";
import { useIsClient } from "@/lib/hooks/use-stored";
import { buttonClass } from "@/components/ui/button";
import { useHelp } from "./help-context";
import { VideoCard, type VideoSummary } from "./video-card";

/**
 * "New here?" on the dashboard of a new partner: the 3 essential tutorials,
 * progress, and a gentle offer of the guided tour. Never blocks anything;
 * "Hide" puts it away for good (the help centre keeps it reachable).
 */
export function NewHere({ videos, base }: { videos: VideoSummary[]; base: string }) {
  const { t } = useI18n();
  const N = t.hp.newHere;
  const { state, update, startTour } = useHelp();
  const client = useIsClient();
  if (!client || state.intro === "dismissed") return null;
  const done = videos.filter((v) => state.videos[v.slug]?.done).length;
  const all = done === videos.length;
  const hide = () => update((s) => ({ ...s, intro: "dismissed" }));
  const offer = state.tour.status === "idle" && state.tourOffer === "open";

  return (
    <section aria-labelledby="new-here-title" className="card relative overflow-hidden p-5 sm:p-6">
      <div className="pointer-events-none absolute -end-20 -top-24 size-64 rounded-full bg-accent/10 blur-3xl" />
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="new-here-title" className="text-[22px] font-semibold tracking-tight sm:text-[24px]">{N.title}</h2>
          <p className="mt-0.5 text-[14.5px] text-muted">{N.subtitle}</p>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={hide} className={buttonClass("ghost", "sm", "text-muted")} aria-label={N.hide}>
            <X className="size-4" /><span className="hidden sm:inline">{N.hide}</span>
          </button>
        </div>
      </div>

      <div className="relative mt-4 flex items-center gap-3">
        {all ? (
          <p className="inline-flex items-center gap-2 rounded-full bg-success-soft px-3 py-1.5 text-[13.5px] font-semibold text-success"><Check className="size-4" />{N.done}</p>
        ) : (
          <>
            <span className="tabular text-[13px] font-medium text-fg-2">{fmt(N.progress, { done, total: videos.length })}</span>
            <span className="h-1.5 max-w-48 flex-1 overflow-hidden rounded-full bg-surface-3" aria-hidden>
              <span className="block h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${(done / videos.length) * 100}%` }} />
            </span>
          </>
        )}
      </div>

      <ul className="relative mt-4 grid gap-3 sm:grid-cols-3">
        {videos.map((v) => <li key={v.slug}><VideoCard v={v} href={`${base}/documents/videos/${v.slug}`} compact /></li>)}
      </ul>

      {offer && (
        <div className="relative mt-4 flex flex-col gap-3 rounded-[20px] bg-surface-2/70 p-4 sm:flex-row sm:items-center">
          <span className="hidden size-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent sm:grid"><Compass className="size-5" /></span>
          <div className="flex-1">
            <p className="text-[15px] font-semibold">{N.offerTitle}</p>
            <p className="text-[13.5px] text-muted">{N.offerBody}</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => startTour(0)} className={buttonClass("accent", "md", "flex-1 sm:flex-none")}>{N.offerCta}</button>
            <button type="button" onClick={() => update((s) => ({ ...s, tourOffer: "later" }))} className={buttonClass("ghost", "md", "text-muted")}>{N.later}</button>
          </div>
        </div>
      )}
    </section>
  );
}
