/**
 * Message personalisation — pure (unit-tested).
 *
 * Templates use {{variable}} placeholders. Only values the affiliate actually
 * typed (or that Studio ATS knows about the affiliate) are injected. Nothing is
 * ever guessed about the prospect: an unknown value stays visible as a
 * [bracketed label] the affiliate must fill before sending.
 */

export const VARIABLES = ["firstName", "company", "sector", "advisorName", "affiliateUrl", "campaign"] as const;
export type Variable = (typeof VARIABLES)[number];
export type Vars = Partial<Record<Variable, string | null | undefined>>;

const PATTERN = /\{\{\s*([a-zA-Z]+)\s*\}\}/g;

/** Legacy V0.1 kit placeholders, kept working. */
const LEGACY: Record<string, Variable> = {
  "your link": "affiliateUrl", "votre lien": "affiliateUrl",
  "your name": "advisorName", "votre nom": "advisorName",
};

export function variablesIn(template: string): Variable[] {
  const out = new Set<Variable>();
  for (const m of template.matchAll(PATTERN)) if ((VARIABLES as readonly string[]).includes(m[1])) out.add(m[1] as Variable);
  return [...out];
}

export function personalize(template: string, vars: Vars, labels: Record<Variable, string>):
  { text: string; missing: Variable[] } {
  const missing = new Set<Variable>();
  const value = (name: Variable) => {
    const v = vars[name]?.trim();
    if (v) return v;
    missing.add(name);
    return `[${labels[name]}]`;
  };
  let text = template.replace(PATTERN, (whole, name: string) =>
    (VARIABLES as readonly string[]).includes(name) ? value(name as Variable) : whole);
  text = text.replace(/\[(your link|votre lien|your name|votre nom)\]/gi, (whole, k: string) => {
    const name = LEGACY[k.toLowerCase()];
    return vars[name]?.trim() ? vars[name]!.trim() : whole;
  });
  return { text, missing: [...missing] };
}

/** mailto: / wa.me helpers — the affiliate always sends from their own app. */
export function mailtoHref(to: string | null, subject: string, body: string) {
  return `mailto:${to ? encodeURIComponent(to) : ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
export function whatsappHref(text: string, phone?: string | null) {
  const digits = phone?.replace(/[^\d]/g, "") ?? "";
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
