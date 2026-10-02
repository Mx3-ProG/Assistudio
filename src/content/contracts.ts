import type { Locale } from "../i18n/config.ts";
import en, { type ContractsDictionary } from "../i18n/dictionaries/contracts.en.ts";
import fr from "../i18n/dictionaries/contracts.fr.ts";
import de from "../i18n/dictionaries/contracts.de.ts";
import es from "../i18n/dictionaries/contracts.es.ts";
import pt from "../i18n/dictionaries/contracts.pt.ts";
import it from "../i18n/dictionaries/contracts.it.ts";
import nl from "../i18n/dictionaries/contracts.nl.ts";
import ar from "../i18n/dictionaries/contracts.ar.ts";
import hi from "../i18n/dictionaries/contracts.hi.ts";

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

const dictionaries: Record<Locale, ContractsDictionary> = { en, fr, de, es, pt, it, nl, ar, hi };

/** Contract copy for a locale (sync: also used by the PDF renderer). */
export function contractCopy(locale: Locale): ContractsDictionary {
  return dictionaries[locale] ?? en;
}

const f = (key: string, type: BriefField["type"], required = false, options?: string[]): BriefField =>
  ({ key, type, required, options });

const definitions: Omit<BriefSection, "title">[] = [
  { id: "project", description: "Core project information", fields: [
    f("project.company", "text", true),
    f("project.name", "text", true),
    f("project.domain", "text"),
    f("project.contact", "text", true),
    f("project.phone", "tel"),
  ] },
  { id: "identity", description: "Business context and conversion goal", fields: [
    f("identity.brand", "text", true),
    f("identity.activity", "textarea", true),
    f("identity.market", "text"),
    f("identity.audience", "textarea"),
    f("identity.goal", "textarea", true),
    f("identity.actions", "checkboxes", false, ["quote", "appointment", "buy", "call", "message", "account", "catalog", "discover"]),
    f("identity.competitors", "textarea"),
  ] },
  { id: "visual", description: "Brand assets and artistic direction", fields: [
    f("visual.assets", "checkboxes", false, ["logo", "guidelines", "colors", "fonts", "photos", "videos", "icons", "none"]),
    f("visual.colors", "text"),
    f("visual.mood", "checkboxes", false, ["institutional", "premium", "minimal", "technology", "creative", "warm", "dynamic", "immersive"]),
    f("visual.mode", "checkboxes", false, ["light", "dark", "both", "studio_choice"]),
    f("visual.references", "textarea"),
    f("visual.avoid", "textarea"),
  ] },
  { id: "content", description: "Site map, messages and supplied content", fields: [
    f("content.pages", "checkboxes", false, ["home", "about", "services", "catalog", "product", "contact", "faq", "blog", "portfolio", "booking", "account", "checkout", "legal"]),
    f("content.tagline", "text"),
    f("content.value", "textarea", true),
    f("content.services", "textarea"),
    f("content.cta", "text"),
    f("content.supplied", "checkboxes", false, ["texts", "photos", "videos", "prices", "testimonials", "faq", "pdf", "products", "needs_creation"]),
  ] },
  { id: "catalog", description: "Products, services and initial import", fields: [
    f("catalog.type", "checkboxes", false, ["none", "services", "products", "mixed"]),
    f("catalog.count", "text"),
    f("catalog.fields", "checkboxes", false, ["name", "summary", "description", "photos", "price", "quote_only", "sku", "category", "variants", "stock", "documents"]),
    f("catalog.import", "checkboxes", false, ["manual", "csv", "excel", "old_site", "api", "unknown"]),
    f("catalog.details", "textarea"),
  ] },
  { id: "team", description: "Back-office users and permissions", fields: [
    f("team.manage", "checkboxes", false, ["pages", "products", "prices", "stock", "orders", "customers", "appointments", "promotions", "users", "media", "blog", "analytics"]),
    f("team.admin", "text"),
    f("team.members", "textarea"),
    f("team.roles", "checkboxes", false, ["admin", "moderator", "sales", "catalog", "support", "accounting"]),
  ] },
  { id: "modules", description: "Advanced modules shown only when selected", fields: [
    f("modules.enabled", "checkboxes", false, ["ecommerce", "accounts", "crm", "booking", "affiliation", "stock"]),
    f("modules.details", "textarea"),
  ] },
  { id: "automation", description: "Triggers, actions and connected tools", fields: [
    f("automation.triggers", "checkboxes", false, ["form", "lead", "appointment", "order", "payment", "account", "stock", "status"]),
    f("automation.actions", "checkboxes", false, ["client_email", "team_email", "crm", "stock", "task", "document", "webhook", "followup"]),
    f("automation.primary", "textarea"),
    f("automation.integrations", "checkboxes", false, ["stripe", "resend", "calendar", "maps", "crm", "erp", "shipping", "social", "api"]),
    f("automation.software", "textarea"),
  ] },
  { id: "compliance", description: "Infrastructure, personal data and legal documents", fields: [
    f("compliance.infrastructure", "checkboxes", false, ["domain", "email", "database", "old_site", "analytics", "none"]),
    f("compliance.provider", "text"),
    f("compliance.data", "checkboxes", false, ["identity", "email", "phone", "address", "account", "orders", "payments", "booking", "documents"]),
    f("compliance.legal", "checkboxes", false, ["legal_notice", "terms", "privacy", "cookies", "needs_help"]),
    f("compliance.constraints", "textarea"),
  ] },
  { id: "rules", description: "Real operational journey and exceptions", fields: [
    f("rules.journey", "textarea", true),
    f("rules.contact", "textarea"),
    f("rules.payment", "textarea"),
    f("rules.delivery", "textarea"),
    f("rules.exceptions", "textarea"),
  ] },
  { id: "priorities", description: "Launch target and missing inputs", fields: [
    f("priorities.level", "checkboxes", false, ["fast", "balanced", "custom"]),
    f("priorities.launch", "date"),
    f("priorities.event", "textarea"),
    f("priorities.missing", "checkboxes", false, ["logo", "texts", "photos", "videos", "products", "domain", "old_site", "legal", "api_keys"]),
    f("priorities.must_have", "textarea", true),
    f("priorities.later", "textarea"),
  ] },
  { id: "validation", description: "Client confirmation before affiliate review", fields: [
    f("validation.confirmations", "checkboxes", true, ["reviewed", "priorities_correct", "out_of_scope_quote", "provide_content", "share_with_affiliate"]),
    f("validation.comment", "textarea"),
  ] },
];

export function briefSections(locale: Locale): BriefSection[] {
  const titles = contractCopy(locale).sections;
  return definitions.map((section, index) => ({ ...section, title: titles[index] }));
}

export function fieldLabel(field: BriefField, locale: Locale): string {
  return contractCopy(locale).fields[field.key] ?? en.fields[field.key] ?? field.key;
}

/** Checkbox choice label; unknown codes are shown as-is. */
export function optionLabel(option: string, locale: Locale): string {
  return contractCopy(locale).options[option] ?? en.options[option] ?? option.replaceAll("_", " ");
}

export function dossierStatusLabel(status: string, locale: Locale): string {
  const labels = contractCopy(locale).statuses as Record<string, string>;
  return labels[status] ?? status;
}
