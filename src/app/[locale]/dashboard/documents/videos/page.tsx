import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { requireAffiliate } from "@/lib/auth";
import { HELP_VIDEOS, HELP_CATEGORIES, ESSENTIALS } from "@/content/help-videos";
import { summarize } from "@/lib/help/videos";
import { PageHeader } from "@/components/ui/primitives";
import { BackLink } from "@/components/sales-center/back-link";
import { VideoCard } from "@/components/help/video-card";

/** The permanent tutorial library: the 3 essentials first, then every tutorial by category. */
export default async function VideoHelp({ params }: PageProps<"/[locale]/dashboard/documents/videos">) {
  const { locale } = (await params) as { locale: Locale };
  await requireAffiliate(locale);
  const t = await getDictionary(locale);
  const V = t.hp.videos;
  const base = `/${locale}/dashboard/documents/videos`;
  const groups = HELP_CATEGORIES.map((c) => ({ c, items: HELP_VIDEOS.filter((v) => v.category === c) })).filter((g) => g.items.length);
  return (
    <div className="space-y-10">
      <div>
        <BackLink href={`/${locale}/dashboard/documents`} label={t.ct.nav.affiliate} />
        <PageHeader title={V.title} subtitle={V.subtitle} />
      </div>
      <section id="essentials" className="scroll-mt-24">
        <h2 className="mb-4 text-[18px] font-semibold tracking-tight">{V.essentials}</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ESSENTIALS.map((v) => <li key={v.slug}><VideoCard v={summarize(v, locale, t)} href={`${base}/${v.slug}`} /></li>)}
        </ul>
      </section>
      <section>
        <h2 className="mb-4 text-[18px] font-semibold tracking-tight">{V.all}</h2>
        <div className="space-y-8">
          {groups.map(({ c, items }) => (
            <div key={c}>
              <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">{V.categories[c]}</h3>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((v) => <li key={v.slug}><VideoCard v={summarize(v, locale, t)} href={`${base}/${v.slug}`} /></li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
