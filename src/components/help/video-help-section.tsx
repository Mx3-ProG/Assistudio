import Link from "next/link";
import { ArrowRight, PlayCircle } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";
import { ESSENTIALS } from "@/content/help-videos";
import { summarize } from "@/lib/help/videos";
import { VideoCard } from "./video-card";

/** "Video help" at the top of Documents: the 3 essentials + the way to the full library. */
export function VideoHelpSection({ t, locale }: { t: Dictionary; locale: Locale }) {
  const V = t.hp.videos;
  const base = `/${locale}/dashboard/documents/videos`;
  return (
    <section data-tour="video-help" aria-labelledby="video-help-title" className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-accent"><PlayCircle className="size-4" />{V.eyebrow}</p>
          <h2 id="video-help-title" className="mt-1 text-[19px] font-semibold tracking-tight">{V.essentials}</h2>
        </div>
        <Link href={base} className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-accent hover:underline">{V.openLibrary}<ArrowRight className="flip-rtl size-4" /></Link>
      </div>
      <ul className="mt-4 grid gap-3 sm:grid-cols-3">
        {ESSENTIALS.map((v) => <li key={v.slug}><VideoCard v={summarize(v, locale, t)} href={`${base}/${v.slug}`} compact /></li>)}
      </ul>
    </section>
  );
}
