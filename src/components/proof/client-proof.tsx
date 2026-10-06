import type { Dictionary } from "@/i18n/types";
import type { Locale } from "@/i18n/config";
import type { PublicProofEvent, PublicTestimonial } from "@/lib/proof";
import type { PublicCaseStudy } from "@/lib/proof-cases";
import { SectionHead } from "@/components/marketing/home/section-head";
import { WorkBand } from "./work-band";
import { CaseStudies } from "./case-studies";
import { Testimonials } from "./testimonials";
import { ProofFeed } from "./proof-feed";

/**
 * Prospect-facing proof: what Studio builds (real screens) → projects to see
 * and test → clients in their own words → recent verified activity. Each block
 * hides itself when it has no real content; demos are always labelled.
 */
export function ClientProof({ t, locale, testimonials, cases, events, demosHref, id = "proof" }: {
  t: Dictionary; locale: Locale; testimonials: PublicTestimonial[]; cases: PublicCaseStudy[]; events: PublicProofEvent[];
  demosHref: string; id?: string;
}) {
  const P = t.pf;
  return (
    <section id={id} className="scroll-mt-20 overflow-hidden py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHead eyebrow={P.client.eyebrow} title={P.client.title} subtitle={P.client.subtitle} />

        <div className="mt-12">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
            <h3 className="text-[20px] font-semibold tracking-tight sm:text-[22px]">{P.work.title}</h3>
            <p className="text-[13.5px] text-muted">{P.work.subtitle}</p>
          </div>
          <WorkBand ctaHref={demosHref} />
        </div>

        <div className="mt-16">
          <div className="mb-6 max-w-2xl">
            <h3 className="text-[22px] font-semibold tracking-tight sm:text-[26px]">{P.cases.title}</h3>
            <p className="mt-1.5 text-[14.5px] text-muted">{P.cases.subtitle}</p>
          </div>
          <CaseStudies t={t} locale={locale} cases={cases} />
        </div>

        <Testimonials items={testimonials} title={P.testimonials.title} subtitle={P.testimonials.subtitle} className="mt-16" />
        <ProofFeed t={t} locale={locale} events={events} types={["new_client", "testimonial_published"]} className="mt-12" />
      </div>
    </section>
  );
}
