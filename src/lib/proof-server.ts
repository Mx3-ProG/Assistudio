import "server-only";
import { repo } from "@/lib/data";
import { log } from "@/lib/log";
import type { Placement, PublicProofEvent, PublicTestimonial, TestimonialType } from "@/lib/proof";
import { publicClientCaseStudies, type PublicCaseStudy } from "@/lib/proof-cases";
import type { Locale } from "@/i18n/config";

/**
 * Public social-proof reads for pages. Best-effort: a missing migration or a
 * database hiccup hides the proof (empty list) instead of breaking the page —
 * never replaced by invented content.
 */
export async function publicTestimonials(filter: { placement?: Placement; type?: TestimonialType; limit?: number }): Promise<PublicTestimonial[]> {
  try {
    return await repo().listPublicTestimonials(filter);
  } catch (e) {
    log.warn("proof", "testimonials unavailable", { error: e instanceof Error ? e.message : String(e) });
    return [];
  }
}

export async function publicProofEvents(limit = 6): Promise<PublicProofEvent[]> {
  try {
    return await repo().listPublicProofEvents(limit);
  } catch (e) {
    log.warn("proof", "proof events unavailable", { error: e instanceof Error ? e.message : String(e) });
    return [];
  }
}

export async function publicCaseStudies(locale: Locale): Promise<PublicCaseStudy[]> {
  try {
    return publicClientCaseStudies(await repo().listPublishedContent(["case_study"]), locale);
  } catch (e) {
    log.warn("proof", "case studies unavailable", { error: e instanceof Error ? e.message : String(e) });
    return [];
  }
}

export interface ClientProofData { testimonials: PublicTestimonial[]; cases: PublicCaseStudy[]; events: PublicProofEvent[] }

/** Everything the prospect-facing proof section needs, for one placement. */
export async function clientProofData(locale: Locale, placement: Placement = "client"): Promise<ClientProofData> {
  const [testimonials, cases, events] = await Promise.all([publicTestimonials({ placement }), publicCaseStudies(locale), publicProofEvents(6)]);
  return { testimonials, cases, events };
}
