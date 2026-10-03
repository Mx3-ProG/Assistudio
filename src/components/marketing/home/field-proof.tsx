import Image from "next/image";
import { ExternalLink, Quote } from "lucide-react";
import type { Dictionary } from "@/i18n/types";
import type { Locale } from "@/i18n/config";
import type { FieldProof as Proof, LocalizedText } from "@/content/field-proof";
import { SectionHead } from "./section-head";

const pick = (x: LocalizedText, locale: Locale) => x[locale] ?? x.en;

/**
 * "Studio already exists in the field": verified references only
 * (see src/content/field-proof.ts). Renders nothing when there are none.
 */
export function FieldProof({ t, locale, proofs }: { t: Dictionary; locale: Locale; proofs: Proof[] }) {
  if (!proofs.length) return null;
  const P = t.hc.proof;
  const shots = proofs.filter((p) => p.screenshot);
  return (
    <section id="proof" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6 sm:py-28">
      <SectionHead eyebrow={P.eyebrow} title={P.title} subtitle={P.subtitle} />
      <ul className="mt-10 grid gap-4 md:grid-cols-2">
        {proofs.map((p) => (
          <li key={p.slug} className="card flex flex-col p-6 sm:p-7">
            <div className="flex items-center gap-3">
              {p.logo && <Image src={p.logo} alt="" width={40} height={40} className="size-10 rounded-xl object-contain" />}
              <div>
                <p className="text-[17px] font-semibold">{p.name}</p>
                <p className="text-[13px] text-muted">{pick(p.sector, locale)}</p>
              </div>
            </div>
            <dl className="mt-5 grid gap-3 text-[14.5px]">
              <div><dt className="text-[12px] font-semibold uppercase tracking-[0.1em] text-muted">{P.problem}</dt><dd className="mt-1 text-fg-2">{pick(p.problem, locale)}</dd></div>
              <div><dt className="text-[12px] font-semibold uppercase tracking-[0.1em] text-muted">{P.solution}</dt><dd className="mt-1 text-fg-2">{pick(p.solution, locale)}</dd></div>
              {(p.features[locale] ?? p.features.en).length > 0 && (
                <div><dt className="text-[12px] font-semibold uppercase tracking-[0.1em] text-muted">{P.features}</dt>
                  <dd className="mt-2 flex flex-wrap gap-1.5">{(p.features[locale] ?? p.features.en).map((f) => <span key={f} className="rounded-full bg-surface-2 px-2.5 py-1 text-[12.5px]">{f}</span>)}</dd></div>
              )}
            </dl>
            {p.testimonial && (
              <blockquote className="mt-5 rounded-2xl bg-accent-soft p-4 text-[14.5px] leading-relaxed">
                <Quote className="mb-1 size-4 text-accent" aria-hidden />
                {pick(p.testimonial, locale)}
                <footer className="mt-2 text-[12.5px] text-muted">— {p.testimonial.author} · {P.testimonial}</footer>
              </blockquote>
            )}
            {p.url && (
              <a href={p.url} target="_blank" rel="noopener" className="mt-5 inline-flex items-center gap-1.5 self-start text-[14px] font-medium text-accent hover:underline">
                {P.viewProject}<ExternalLink className="size-3.5" />
              </a>
            )}
          </li>
        ))}
      </ul>
      {shots.length > 0 && (
        <>
          <h3 className="mt-14 text-[20px] font-semibold tracking-tight">{P.galleryTitle}</h3>
          <ul className="no-scrollbar -mx-4 mt-5 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
            {shots.map((p) => (
              <li key={p.slug} className="w-[78%] shrink-0 snap-start sm:w-[44%] lg:w-[32%]">
                <Image src={p.screenshot!} alt={p.name} width={960} height={600} sizes="(min-width: 1024px) 32vw, (min-width: 640px) 44vw, 78vw"
                  className="aspect-[16/10] w-full rounded-2xl border border-line object-cover object-top" />
                <p className="mt-2 text-[13px] text-muted">{p.name} · {pick(p.sector, locale)}</p>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
