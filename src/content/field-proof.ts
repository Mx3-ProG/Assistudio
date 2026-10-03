/**
 * Public field proof shown on the partner home ("Studio already exists in the field").
 *
 * NEVER invent a client, a quote, a figure or a result. An entry is displayed
 * only when `consent` is filled in: the client agreed in writing to be shown
 * as a public reference (date + who recorded it). Without verified entries the
 * section does not render at all — no placeholder is ever shown to visitors.
 *
 * Candidates: the projects in src/content/sales-center/case-studies.ts
 * (screenshots in public/portfolio). They are still DRAFTS pending Studio's
 * validation of each project's type and each client's agreement.
 *
 * Example (do not uncomment without a real, documented agreement):
 * {
 *   slug: "example-client",
 *   name: "Client name",
 *   sector: { en: "Hospitality", fr: "Hôtellerie" },
 *   logo: "/portfolio/example-logo.png",          // optional
 *   screenshot: "/portfolio/example.webp",        // optional, real screenshot only
 *   problem: { en: "…", fr: "…" },
 *   solution: { en: "…", fr: "…" },
 *   features: { en: ["Leads", "Appointments"], fr: ["Demandes", "Rendez-vous"] },
 *   testimonial: { en: "…", fr: "…", author: "First name, role" }, // only a verified, written quote
 *   url: "https://…",
 *   consent: { verifiedAt: "2026-10-03", by: "name of the Studio staff member" },
 * }
 */
export interface LocalizedText { en: string; fr: string; [locale: string]: string }

export interface FieldProof {
  slug: string;
  name: string;
  sector: LocalizedText;
  logo?: string;
  screenshot?: string;
  problem: LocalizedText;
  solution: LocalizedText;
  features: { en: string[]; fr: string[]; [locale: string]: string[] };
  testimonial?: LocalizedText & { author: string };
  url?: string;
  consent: { verifiedAt: string; by: string } | null;
}

export const FIELD_PROOF: FieldProof[] = [];

/** Only references with a recorded agreement are public. */
export function publicFieldProof(list: FieldProof[] = FIELD_PROOF): FieldProof[] {
  return list.filter((p) => p.consent && /^\d{4}-\d{2}-\d{2}$/.test(p.consent.verifiedAt) && p.consent.by.trim().length > 0);
}
