/**
 * Public mini case studies. Two sources, never mixed up on screen:
 *   - client projects: `sales_content` case studies of type "client" (Admin →
 *     Sales content) that carry a documented PUBLIC consent of the client
 *     (`publicConsentAt` YYYY-MM-DD + `publicConsentBy`). Without it a project
 *     stays inside the partner space.
 *   - interactive demonstrations: src/lib/demos.ts, always labelled as demos.
 * A result is displayed only when it is filled in (with its source).
 */
import type { CaseStudyBody } from "./sales/content.ts";
import { pickLocale } from "./sales/content.ts";

export interface CaseContent { kind: string; key: string; locale: string; status?: string; body: unknown }

export interface PublicCaseStudy {
  key: string;
  name: string;
  sector: string;
  clientType: string;
  problem: string;
  solution: string;
  features: string[];
  result: string | null;
  resultSource: string | null;
  url: string | null;
  image: string | null;
  imageMobile: string | null;
  demoSlug: string | null;
}

export function hasPublicConsent(b: Partial<CaseStudyBody>): boolean {
  return b.type === "client" && /^\d{4}-\d{2}-\d{2}$/.test(b.publicConsentAt ?? "") && (b.publicConsentBy ?? "").trim().length > 1;
}

export function publicClientCaseStudies(items: CaseContent[], locale: string): PublicCaseStudy[] {
  return pickLocale(items.filter((c) => c.kind === "case_study"), locale)
    .map((c) => ({ key: c.key, b: c.body as Partial<CaseStudyBody> }))
    .filter(({ b }) => hasPublicConsent(b))
    .map(({ key, b }) => ({
      key, name: b.name ?? "", sector: b.sector ?? "", clientType: b.clientType ?? "", problem: b.problem ?? "",
      solution: b.solution ?? "", features: b.features ?? [], result: b.result?.trim() || null,
      resultSource: b.result?.trim() ? b.resultSource?.trim() || null : null, url: b.url ?? null,
      image: b.image ?? null, imageMobile: b.imageMobile ?? null, demoSlug: b.demoSlug ?? null,
    }));
}
