import { localeMeta, type Locale } from "../i18n/config.ts";
import type { ContractsDictionary } from "../i18n/dictionaries/contracts.en.ts";
import en from "../i18n/dictionaries/contracts.en.ts";
import fr from "../i18n/dictionaries/contracts.fr.ts";
import de from "../i18n/dictionaries/contracts.de.ts";
import es from "../i18n/dictionaries/contracts.es.ts";
import pt from "../i18n/dictionaries/contracts.pt.ts";
import it from "../i18n/dictionaries/contracts.it.ts";
import nl from "../i18n/dictionaries/contracts.nl.ts";
import ar from "../i18n/dictionaries/contracts.ar.ts";

/** Contract copy is needed outside React (PDFs, emails), so it is loaded synchronously. */
const copies: Record<Locale, ContractsDictionary> = { en, fr, de, es, pt, it, nl, ar };

export function contractsCopy(locale: Locale): ContractsDictionary {
  return copies[locale] ?? en;
}

export type BriefField = {
  key: string;
  type: "text" | "email" | "tel" | "date" | "textarea" | "checkboxes";
  options?: string[];
  required?: boolean;
};

export type BriefSection = {
  id: string;
  title: string;
  description: string;
  fields: BriefField[];
};

const f = (key: string, type: BriefField["type"], required = false, options?: string[]): BriefField =>
  ({ key, type, required, options });

const definitions: { id: string; fields: BriefField[] }[] = [
  { id: "project", fields: [
    f("project.company", "text", true),
    f("project.name", "text", true),
    f("project.domain", "text"),
    f("project.contact", "text", true),
    f("project.phone", "tel"),
  ] },
  { id: "identity", fields: [
    f("identity.brand", "text", true),
    f("identity.activity", "textarea", true),
    f("identity.market", "text"),
    f("identity.audience", "textarea"),
    f("identity.goal", "textarea", true),
    f("identity.actions", "checkboxes", false, ["quote", "appointment", "buy", "call", "message", "account", "catalog", "discover"]),
    f("identity.competitors", "textarea"),
  ] },
  { id: "visual", fields: [
    f("visual.assets", "checkboxes", false, ["logo", "guidelines", "colors", "fonts", "photos", "videos", "icons", "none"]),
    f("visual.colors", "text"),
    f("visual.mood", "checkboxes", false, ["institutional", "premium", "minimal", "technology", "creative", "warm", "dynamic", "immersive"]),
    f("visual.mode", "checkboxes", false, ["light", "dark", "both", "studio_choice"]),
    f("visual.references", "textarea"),
    f("visual.avoid", "textarea"),
  ] },
  { id: "content", fields: [
    f("content.pages", "checkboxes", false, ["home", "about", "services", "catalog", "product", "contact", "faq", "blog", "portfolio", "booking", "account", "checkout", "legal"]),
    f("content.tagline", "text"),
    f("content.value", "textarea", true),
    f("content.services", "textarea"),
    f("content.cta", "text"),
    f("content.supplied", "checkboxes", false, ["texts", "photos", "videos", "prices", "testimonials", "faq", "pdf", "products", "needs_creation"]),
  ] },
  { id: "catalog", fields: [
    f("catalog.type", "checkboxes", false, ["none", "services", "products", "mixed"]),
    f("catalog.count", "text"),
    f("catalog.fields", "checkboxes", false, ["name", "summary", "description", "photos", "price", "quote_only", "sku", "category", "variants", "stock", "documents"]),
    f("catalog.import", "checkboxes", false, ["manual", "csv", "excel", "old_site", "api", "unknown"]),
    f("catalog.details", "textarea"),
  ] },
  { id: "team", fields: [
    f("team.manage", "checkboxes", false, ["pages", "products", "prices", "stock", "orders", "customers", "appointments", "promotions", "users", "media", "blog", "analytics"]),
    f("team.admin", "text"),
    f("team.members", "textarea"),
    f("team.roles", "checkboxes", false, ["admin", "moderator", "sales", "catalog", "support", "accounting"]),
  ] },
  { id: "modules", fields: [
    f("modules.enabled", "checkboxes", false, ["ecommerce", "accounts", "crm", "booking", "affiliation", "stock"]),
    f("modules.details", "textarea"),
  ] },
  { id: "automation", fields: [
    f("automation.triggers", "checkboxes", false, ["form", "lead", "appointment", "order", "payment", "account", "stock", "status"]),
    f("automation.actions", "checkboxes", false, ["client_email", "team_email", "crm", "stock", "task", "document", "webhook", "followup"]),
    f("automation.primary", "textarea"),
    f("automation.integrations", "checkboxes", false, ["stripe", "resend", "calendar", "maps", "crm", "erp", "shipping", "social", "api"]),
    f("automation.software", "textarea"),
  ] },
  { id: "compliance", fields: [
    f("compliance.infrastructure", "checkboxes", false, ["domain", "email", "database", "old_site", "analytics", "none"]),
    f("compliance.provider", "text"),
    f("compliance.data", "checkboxes", false, ["identity", "email", "phone", "address", "account", "orders", "payments", "booking", "documents"]),
    f("compliance.legal", "checkboxes", false, ["legal_notice", "terms", "privacy", "cookies", "needs_help"]),
    f("compliance.constraints", "textarea"),
  ] },
  { id: "rules", fields: [
    f("rules.journey", "textarea", true),
    f("rules.contact", "textarea"),
    f("rules.payment", "textarea"),
    f("rules.delivery", "textarea"),
    f("rules.exceptions", "textarea"),
  ] },
  { id: "priorities", fields: [
    f("priorities.level", "checkboxes", false, ["fast", "balanced", "custom"]),
    f("priorities.launch", "date"),
    f("priorities.event", "textarea"),
    f("priorities.missing", "checkboxes", false, ["logo", "texts", "photos", "videos", "products", "domain", "old_site", "legal", "api_keys"]),
    f("priorities.must_have", "textarea", true),
    f("priorities.later", "textarea"),
  ] },
  { id: "validation", fields: [
    f("validation.confirmations", "checkboxes", true, ["reviewed", "priorities_correct", "out_of_scope_quote", "provide_content", "share_with_affiliate"]),
    f("validation.comment", "textarea"),
  ] },
];

export function briefSections(locale: Locale): BriefSection[] {
  const t = contractsCopy(locale);
  return definitions.map((section) => ({ ...section, ...(t.sections[section.id] ?? en.sections[section.id]) }));
}

export function fieldLabel(field: BriefField, locale: Locale): string {
  return contractsCopy(locale).fields[field.key] ?? en.fields[field.key] ?? field.key;
}

export function optionLabel(option: string, locale: Locale): string {
  return contractsCopy(locale).options[option] ?? en.options[option] ?? option.replaceAll("_", " ");
}

/** Human-readable answer: option keys become labels, booleans become yes/no. */
export function answerText(field: BriefField, value: unknown, locale: Locale): string {
  const t = contractsCopy(locale);
  if (Array.isArray(value)) return value.map((v) => field.options?.includes(String(v)) ? optionLabel(String(v), locale) : String(v)).join(", ");
  if (typeof value === "boolean") return value ? t.yes : t.no;
  return String(value ?? "");
}

export function dossierStatusLabel(status: string, locale: Locale): string {
  return contractsCopy(locale).statuses[status] ?? en.statuses[status] ?? status;
}

export function documentKindLabel(kind: string, locale: Locale): string {
  return contractsCopy(locale).docKinds[kind] ?? en.docKinds[kind] ?? kind;
}

/** Contract languages, labelled in their own language. */
export const CONTRACT_LANGUAGES = (Object.keys(localeMeta) as Locale[]).map((code) => ({ code, label: localeMeta[code].label }));

export const DOSSIER_STATUS_LABELS = Object.fromEntries(
  (Object.keys(copies) as Locale[]).map((locale) => [locale, copies[locale].statuses]),
) as Record<Locale, Record<string, string>>;
