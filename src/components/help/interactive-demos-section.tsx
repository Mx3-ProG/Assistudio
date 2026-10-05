import Image from "next/image";
import Link from "next/link";
import { MousePointerClick, Sparkles } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";
import { INTERACTIVE_DEMOS } from "@/content/interactive-demos";
import { pick } from "@/content/help-videos";
import { Badge, EmptyState } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";

/** "Interactive demos" in Documents: mini demos prospects can try (registry: src/content/interactive-demos.ts). */
export function InteractiveDemosSection({ t, locale }: { t: Dictionary; locale: Locale }) {
  const L = t.hp.library;
  const base = `/${locale}/dashboard/documents/demos`;
  return (
    <section id="demos" aria-labelledby="demos-title" className="card p-5 sm:p-6">
      <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-accent"><Sparkles className="size-4" />{L.demosEyebrow}</p>
      <h2 id="demos-title" className="mt-1 text-[19px] font-semibold tracking-tight">{L.demosTitle}</h2>
      <p className="mt-1 text-sm text-muted">{L.demosSubtitle}</p>
      {INTERACTIVE_DEMOS.length ? (
        <ul className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {INTERACTIVE_DEMOS.map((d) => (
            <li key={d.slug} className="flex flex-col overflow-hidden rounded-2xl border border-line">
              <div className="relative grid aspect-[16/10] place-items-center bg-surface-2 text-muted">
                {d.thumb ? <Image src={d.thumb} alt="" fill sizes="(min-width: 1024px) 400px, 100vw" className="object-cover object-top" /> : <MousePointerClick className="size-8" />}
              </div>
              <div className="flex flex-1 flex-col gap-3 p-4">
                <div>
                  <h3 className="text-[16px] font-semibold leading-tight">{pick(d.title, locale)}</h3>
                  <div className="mt-2 flex flex-wrap gap-1.5"><Badge>{L.demoBadge}</Badge>{d.sector && <Badge tone="accent">{pick(d.sector, locale)}</Badge>}</div>
                </div>
                <p className="text-[14px] leading-relaxed text-fg-2">{pick(d.description, locale)}</p>
                <Link href={`${base}/${d.slug}`} className={buttonClass("secondary", "sm", "mt-auto self-start")}><MousePointerClick className="size-4" />{L.demoOpen}</Link>
              </div>
            </li>
          ))}
        </ul>
      ) : <div className="mt-4"><EmptyState icon={<Sparkles />} title={L.demosEmpty} /></div>}
    </section>
  );
}
