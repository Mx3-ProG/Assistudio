import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";
import { pick, videoLength, type HelpVideo } from "@/content/help-videos";
import type { VideoSummary } from "@/components/help/video-card";

/** Localized card data for a tutorial (server side, so client bundles get strings, not every language). */
export function summarize(v: HelpVideo, locale: Locale, t: Dictionary): VideoSummary {
  return {
    slug: v.slug,
    category: t.hp.videos.categories[v.category],
    title: pick(v.title, locale),
    description: pick(v.description, locale),
    thumb: v.thumb,
    length: videoLength(v),
    readMinutes: v.readMinutes,
    essential: v.essential,
  };
}
