/**
 * Sales Center content model — pure (unit-tested, no framework imports).
 *
 * Every piece of sales content (playbooks, scripts, messages, emails,
 * objections, product knowledge, assets, sales angles, landing-page templates
 * and variants, the first-week journey) is ONE row of `public.sales_content`:
 * kind + key + locale identify it, version + status give its history.
 *
 * The body shape per kind is described once here as field descriptors. They
 * drive BOTH the admin editor (rendered generically) and the server-side
 * validation (`validateBody`), so the two can never drift.
 */
import { z } from "zod";

export const CONTENT_KINDS = [
  "playbook", "call_script", "message", "email_template", "objection", "knowledge",
  "asset", "sales_angle", "page_template", "page_variant", "journey",
  // V0.4 ambassador copilot
  "pitch", "case_study", "diagnostic", "sequence",
  // V0.5 guided pipeline
  "stage_guide", "reply", "fact", "find_source", "signal",
] as const;
export type ContentKind = (typeof CONTENT_KINDS)[number];

export const CONTENT_STATUSES = ["draft", "active", "archived"] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const CHANNELS = ["phone", "email", "linkedin", "whatsapp", "sms", "instagram", "in_person", "other"] as const;
export type Channel = (typeof CHANNELS)[number];

export const FUNNEL_STAGES = [
  "first_contact", "follow_up", "after_call", "proposal", "no_response", "interested", "objection", "closing", "renewal",
] as const;
export type FunnelStage = (typeof FUNNEL_STAGES)[number];

export const CTA_MODES = ["buy", "lead", "call", "quote", "question"] as const;
export type CtaMode = (typeof CTA_MODES)[number];

export const PLAYBOOK_STEPS = [
  "understand", "opening", "discovery", "pain", "present", "value", "objections", "offer", "follow_up", "close",
] as const;
export type PlaybookStepKey = (typeof PLAYBOOK_STEPS)[number];

export const SCRIPT_STEP_TYPES = ["opening", "question", "listen", "problem", "response", "objection", "answer", "cta"] as const;
export type ScriptStepType = (typeof SCRIPT_STEP_TYPES)[number];

export const KNOWLEDGE_SECTIONS = [
  "what_it_is", "what_it_does", "customer_gets", "benefits", "features", "technical",
  "included", "not_included", "pricing", "faq", "limitations",
] as const;
export type KnowledgeSection = (typeof KNOWLEDGE_SECTIONS)[number];

export const ASSET_CATEGORIES = [
  "pdf", "technical_sheet", "presentation", "image", "video", "demo", "brochure", "document",
] as const;
export type AssetCategory = (typeof ASSET_CATEGORIES)[number];

/** What a commercial asset is — never present a template or an internal product as a client. */
export const CASE_STUDY_TYPES = ["client", "template", "product", "demo"] as const;
export type CaseStudyType = (typeof CASE_STUDY_TYPES)[number];

export const OFFER_TIERS = ["one", "pro", "premium"] as const;
export type OfferTierKey = (typeof OFFER_TIERS)[number];

/** CRM stages the guidance can target (mirror of PROSPECT_STAGES, kept here so this module stays pure). */
export const GUIDE_STAGES = [
  "new", "contacted", "replied", "qualified", "interested", "proof_sent", "proposal", "appointment", "handed_off", "checkout", "won", "lost",
] as const;
export type GuideStage = (typeof GUIDE_STAGES)[number];
export const GUIDE_EVENTS = [
  "message_sent", "reply_received", "need_identified", "interest", "proof_sent", "offer_presented",
  "meeting", "handed_off", "quote", "won", "lost", "stage_changed",
] as const;
export const SHOW_KINDS = ["none", "case_study", "page", "offer"] as const;
export const FACT_CATEGORIES = [
  "promises", "company", "contact", "offers", "pricing", "process", "delays", "payment", "support",
  "maintenance", "commissions", "after_sale", "references", "faq", "documents",
] as const;
export const FIND_SOURCES = ["network", "linkedin", "instagram", "past_clients", "professional", "local", "contacts"] as const;

export const PAGE_SECTIONS = [
  "hero", "problem", "solution", "value", "how", "benefits", "included", "who", "faq", "offer", "cta",
] as const;
export type PageSection = (typeof PAGE_SECTIONS)[number];

// ------------------------------------------------------------------ bodies
export interface PlaybookBody {
  intro?: string;
  steps: { key: PlaybookStepKey; title: string; body: string; bullets?: string[] }[];
}
export interface CallScriptBody {
  intro?: string;
  steps: { type: ScriptStepType; text: string; hint?: string }[];
}
export interface MessageBody { text: string }
export interface EmailBody { subject: string; preview: string; body: string; cta: string }
export interface ObjectionBody {
  objection: string;
  meaning: string;
  questions: string[];
  short: string;
  long: string;
  proof?: string;
  nextStep: string;
}
export interface KnowledgeBody {
  section: KnowledgeSection;
  items: { title: string; body: string; availability?: "available" | "planned" | "not_included" }[];
}
export interface AssetBody { category: AssetCategory; url: string; description?: string; fileType?: string }
export interface SalesAngleBody { promise: string; heroTitle: string; heroSubtitle: string }
export interface PageTemplateBody {
  ctaModes: CtaMode[];
  defaultCta: CtaMode;
  sections: PageSection[];
  heroTitle: string;
  heroSubtitle: string;
  problemTitle: string;
  problemBody: string;
  solutionTitle: string;
  solutionBody: string;
  valueTitle: string;
  valueItems: string[];
  howTitle: string;
  howSteps: { title: string; body: string }[];
  benefitsTitle: string;
  benefits: { title: string; body: string }[];
  includedTitle: string;
  whoTitle: string;
  whoBody: string;
  faqTitle: string;
  offerTitle: string;
  offerNote: string;
  ctaTitle: string;
  ctaBody: string;
}
export interface PageVariantBody {
  template: string;
  heroTitle?: string;
  heroSubtitle?: string;
  problemTitle?: string;
  problemBody?: string;
  examples?: string[];
  benefits?: { title: string; body: string }[];
  ctaTitle?: string;
  ctaBody?: string;
}
export interface JourneyBody {
  disclaimer: string;
  days: { day: number; title: string; body: string; tasks: string[] }[];
}

/** "Understand Studio" — the pitch at three lengths. */
export interface PitchBody {
  oneLiner: string;
  short: string;   // 15 seconds
  medium: string;  // 30 seconds
  long: string;    // when the prospect is interested
  problem: string;
  forWhom: string;
  whatTheyBuy: string[];
  notThis?: string[];
}
/** A real project, template or product an ambassador can show. */
export interface CaseStudyBody {
  type: CaseStudyType;
  name: string;
  sector: string;
  clientType: string;
  description: string;
  problem: string;
  solution: string;
  features: string[];
  argument: string;
  offer?: OfferTierKey;
  url?: string;
  image?: string;
  imageMobile?: string;
}
export interface DiagnosticBody {
  intro?: string;
  questions: { question: string; listenFor: string; studio: string }[];
}
export interface SequenceBody {
  intro?: string;
  steps: { day: number; channel: Channel; goal: string; text: string }[];
}

/** What to do at one CRM stage. `targetKey` on the row = a sector-specific override. */
export interface StageGuideBody {
  stage: GuideStage;
  goal: string;
  why: string;
  action: string;
  dont?: string;
  /** Message stage to recommend (messages library). */
  say?: FunnelStage;
  show: (typeof SHOW_KINDS)[number];
  /** Show the sector's discovery questions. */
  ask?: "yes" | "no";
  collect?: string[];
  outcomes?: { label: string; to: GuideStage; event: (typeof GUIDE_EVENTS)[number] }[];
  escalate?: string;
}
/** What the prospect said → how to answer (level 1 answer yourself, 2 recommended answer, 3 hand over to Studio). */
export interface ReplyBody {
  said: string;
  level: number;
  meaning?: string;
  answer: string;
  question?: string;
  objection?: string;
  show: (typeof SHOW_KINDS)[number];
  to?: GuideStage;
  next: string;
  stages?: GuideStage[];
}
/** Official Studio information — the ambassador's source of truth. */
export interface FactBody {
  category: (typeof FACT_CATEGORIES)[number];
  question: string;
  answer: string;
  level: number;
  can?: string[];
  cannot?: string[];
}
export interface FindSourceBody {
  source: (typeof FIND_SOURCES)[number];
  how: string;
  action: string;
  tip?: string;
}
/** A phrase or observable situation that can reveal a Studio opportunity. */
export interface SignalBody {
  signal: string;
  problem: string;
  question: string;
  studio: string;
  proof: string;
  next: string;
}

export interface BodyByKind {
  playbook: PlaybookBody;
  call_script: CallScriptBody;
  message: MessageBody;
  email_template: EmailBody;
  objection: ObjectionBody;
  knowledge: KnowledgeBody;
  asset: AssetBody;
  sales_angle: SalesAngleBody;
  page_template: PageTemplateBody;
  page_variant: PageVariantBody;
  journey: JourneyBody;
  pitch: PitchBody;
  case_study: CaseStudyBody;
  diagnostic: DiagnosticBody;
  sequence: SequenceBody;
  stage_guide: StageGuideBody;
  reply: ReplyBody;
  fact: FactBody;
  find_source: FindSourceBody;
  signal: SignalBody;
}

export interface SalesContent<K extends ContentKind = ContentKind> {
  id: string;
  kind: K;
  key: string;
  locale: string;
  version: number;
  status: ContentStatus;
  productId: string | null;
  targetKey: string | null;
  channel: Channel | null;
  stage: FunnelStage | null;
  title: string;
  summary: string | null;
  body: BodyByKind[K];
  tags: string[];
  sort: number;
  publishedAt: string | null;
  updatedAt: string;
  /** Shown in another locale because no translation is published yet. */
  fallback?: boolean;
}

export const isKind = <K extends ContentKind>(c: SalesContent, kind: K): c is SalesContent<K> => c.kind === kind;

// ------------------------------------------------------------------ field descriptors
export type FieldType = "text" | "textarea" | "list" | "select" | "multiselect" | "number" | "group";
export interface FieldSpec {
  name: string;
  type: FieldType;
  required?: boolean;
  max?: number;
  options?: readonly string[];
  /** Sub-fields of each item of a repeatable group. */
  fields?: FieldSpec[];
}

const text = (name: string, required = true, max = 400): FieldSpec => ({ name, type: "text", required, max });
const area = (name: string, required = true, max = 6000): FieldSpec => ({ name, type: "textarea", required, max });
const list = (name: string, required = false): FieldSpec => ({ name, type: "list", required, max: 600 });
const select = (name: string, options: readonly string[], required = true): FieldSpec => ({ name, type: "select", options, required });
const group = (name: string, fields: FieldSpec[], required = true): FieldSpec => ({ name, type: "group", fields, required });

export const BODY_FIELDS: { [K in ContentKind]: FieldSpec[] } = {
  playbook: [
    area("intro", false, 1200),
    group("steps", [select("key", PLAYBOOK_STEPS), text("title"), area("body", true, 3000), list("bullets")]),
  ],
  call_script: [
    area("intro", false, 1200),
    group("steps", [select("type", SCRIPT_STEP_TYPES), area("text", true, 1200), text("hint", false)]),
  ],
  message: [area("text", true, 4000)],
  email_template: [text("subject", true, 200), text("preview", true, 200), area("body", true, 8000), text("cta", true, 200)],
  objection: [
    text("objection"), area("meaning", true, 1500), list("questions", true), area("short", true, 800),
    area("long", true, 3000), area("proof", false, 1500), text("nextStep", true, 400),
  ],
  knowledge: [
    select("section", KNOWLEDGE_SECTIONS),
    group("items", [text("title"), area("body", true, 3000), select("availability", ["available", "planned", "not_included"], false)]),
  ],
  asset: [select("category", ASSET_CATEGORIES), text("url", true, 1000), area("description", false, 1500), text("fileType", false, 40)],
  sales_angle: [text("promise"), text("heroTitle"), area("heroSubtitle", true, 600)],
  page_template: [
    { name: "ctaModes", type: "multiselect", options: CTA_MODES, required: true },
    select("defaultCta", CTA_MODES),
    { name: "sections", type: "multiselect", options: PAGE_SECTIONS, required: true },
    text("heroTitle"), area("heroSubtitle", true, 600),
    text("problemTitle"), area("problemBody", true, 1500),
    text("solutionTitle"), area("solutionBody", true, 1500),
    text("valueTitle"), list("valueItems", true),
    text("howTitle"), group("howSteps", [text("title"), area("body", true, 600)]),
    text("benefitsTitle"), group("benefits", [text("title"), area("body", true, 600)]),
    text("includedTitle"), text("whoTitle"), area("whoBody", true, 1500), text("faqTitle"),
    text("offerTitle"), area("offerNote", true, 600), text("ctaTitle"), area("ctaBody", true, 600),
  ],
  page_variant: [
    text("template", true, 80),
    text("heroTitle", false), area("heroSubtitle", false, 600),
    text("problemTitle", false), area("problemBody", false, 1500),
    list("examples"), group("benefits", [text("title"), area("body", true, 600)], false),
    text("ctaTitle", false), area("ctaBody", false, 600),
  ],
  journey: [
    area("disclaimer", true, 600),
    group("days", [{ name: "day", type: "number", required: true }, text("title"), area("body", true, 1200), list("tasks", true)]),
  ],
  pitch: [
    text("oneLiner", true, 300), area("short", true, 600), area("medium", true, 1200), area("long", true, 4000),
    area("problem", true, 1500), area("forWhom", true, 1500), list("whatTheyBuy", true), list("notThis"),
  ],
  case_study: [
    select("type", CASE_STUDY_TYPES), text("name", true, 120), text("sector", true, 120), text("clientType", true, 200),
    area("description", true, 600), area("problem", true, 1500), area("solution", true, 1500), list("features", true),
    area("argument", true, 800), select("offer", OFFER_TIERS, false),
    text("url", false, 1000), text("image", false, 400), text("imageMobile", false, 400),
  ],
  diagnostic: [
    area("intro", false, 1200),
    group("questions", [text("question"), area("listenFor", true, 800), area("studio", true, 800)]),
  ],
  sequence: [
    area("intro", false, 1200),
    group("steps", [{ name: "day", type: "number", required: true }, select("channel", CHANNELS), text("goal"), area("text", true, 3000)]),
  ],
  stage_guide: [
    select("stage", GUIDE_STAGES), text("goal"), area("why", true, 600), area("action", true, 600), area("dont", false, 600),
    select("say", FUNNEL_STAGES, false), select("show", SHOW_KINDS), select("ask", ["yes", "no"], false), list("collect"),
    group("outcomes", [text("label", true, 120), select("to", GUIDE_STAGES), select("event", GUIDE_EVENTS)], false),
    area("escalate", false, 600),
  ],
  reply: [
    text("said", true, 200), { name: "level", type: "number", required: true }, area("meaning", false, 600), area("answer", true, 1500),
    area("question", false, 600), text("objection", false, 80), select("show", SHOW_KINDS), select("to", GUIDE_STAGES, false),
    area("next", true, 600), { name: "stages", type: "multiselect", options: GUIDE_STAGES, required: false },
  ],
  fact: [
    select("category", FACT_CATEGORIES), text("question", true, 300), area("answer", true, 3000),
    { name: "level", type: "number", required: true }, list("can"), list("cannot"),
  ],
  find_source: [select("source", FIND_SOURCES), area("how", true, 1200), area("action", true, 400), area("tip", false, 600)],
  signal: [
    text("signal", true, 300), area("problem", true, 1000), area("question", true, 600),
    area("studio", true, 1000), area("proof", true, 600), area("next", true, 600),
  ],
};

// ------------------------------------------------------------------ validation
function zodFor(f: FieldSpec): z.ZodType {
  let t: z.ZodType;
  switch (f.type) {
    case "text":
    case "textarea": {
      const s = z.string().trim().max(f.max ?? 6000);
      t = f.required ? s.min(1) : s;
      break;
    }
    case "list": {
      const a = z.array(z.string().trim().min(1).max(f.max ?? 600)).max(50);
      t = f.required ? a.min(1) : a;
      break;
    }
    case "select":
      t = z.enum(f.options as [string, ...string[]]);
      break;
    case "multiselect": {
      const a = z.array(z.enum(f.options as [string, ...string[]])).max(f.options!.length);
      t = f.required ? a.min(1) : a;
      break;
    }
    case "number":
      t = z.coerce.number().int().min(0).max(10_000);
      break;
    case "group": {
      const a = z.array(objectFor(f.fields!)).max(40);
      t = f.required ? a.min(1) : a;
      break;
    }
  }
  return f.required ? t : t.optional();
}

function objectFor(fields: FieldSpec[]) {
  return z.object(Object.fromEntries(fields.map((f) => [f.name, zodFor(f)])));
}

/** Drops empty optional values so stored bodies stay clean. */
function prune(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(prune);
  if (v && typeof v === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v)) {
      if (x === "" || x === undefined || x === null || (Array.isArray(x) && x.length === 0)) continue;
      out[k] = prune(x);
    }
    return out;
  }
  return v;
}

export function validateBody<K extends ContentKind>(kind: K, body: unknown):
  { ok: true; body: BodyByKind[K] } | { ok: false; errors: string[] } {
  const res = objectFor(BODY_FIELDS[kind]).safeParse(prune(body));
  if (!res.success) return { ok: false, errors: res.error.issues.map((i) => i.path.join(".") || "body") };
  const extra = kindRules(kind, res.data as unknown as BodyByKind[K]);
  return extra.length ? { ok: false, errors: extra } : { ok: true, body: res.data as unknown as BodyByKind[K] };
}

function kindRules<K extends ContentKind>(kind: K, body: BodyByKind[K]): string[] {
  if (kind === "page_template") {
    const b = body as PageTemplateBody;
    if (!b.ctaModes.includes(b.defaultCta)) return ["defaultCta"];
    if (!b.sections.includes("hero") || !b.sections.includes("cta")) return ["sections"];
  }
  if (kind === "asset") {
    const u = (body as AssetBody).url;
    if (!safeUrl(u)) return ["url"];
  }
  if (kind === "case_study") {
    const b = body as CaseStudyBody;
    const bad = (["url", "image", "imageMobile"] as const).filter((k) => b[k] !== undefined && !safeUrl(b[k]!));
    if (bad.length) return [...bad];
  }
  if (kind === "reply" || kind === "fact") {
    const level = (body as ReplyBody | FactBody).level;
    if (![1, 2, 3].includes(level)) return ["level"];
  }
  if (kind === "stage_guide" && ((body as StageGuideBody).outcomes?.length ?? 0) > 6) return ["outcomes"];
  if (kind === "sequence") {
    const days = (body as SequenceBody).steps.map((s) => s.day);
    if (days.some((d, i) => i > 0 && d <= days[i - 1])) return ["steps"];
  }
  return [];
}

/** https:// or a site-relative path — never javascript:, data: or protocol-relative URLs. */
const safeUrl = (u: string) => /^(https:\/\/|\/)/.test(u) && !u.startsWith("//");

export const KEY_PATTERN = /^[a-z0-9][a-z0-9_.:-]{0,79}$/;

// ------------------------------------------------------------------ locale resolution
/**
 * One item per (kind, key): the requested locale when published, otherwise the
 * English source flagged `fallback` — content is never machine-translated here.
 */
export function pickLocale<T extends { kind: string; key: string; locale: string }>(
  items: T[], locale: string, source = "en",
): (T & { fallback: boolean })[] {
  const byKey = new Map<string, T & { fallback: boolean }>();
  for (const it of items) {
    const id = `${it.kind}:${it.key}`;
    const cur = byKey.get(id);
    if (it.locale === locale) byKey.set(id, { ...it, fallback: false });
    else if (!cur && it.locale === source) byKey.set(id, { ...it, fallback: locale !== source });
  }
  return [...byKey.values()];
}

/** Content relevant for a target: target-specific first, then generic (target null). */
export function forTarget<T extends { targetKey: string | null; sort: number }>(items: T[], target: string | null): T[] {
  return items
    .filter((c) => c.targetKey === null || (target !== null && c.targetKey === target))
    .sort((a, b) => Number(b.targetKey !== null) - Number(a.targetKey !== null) || a.sort - b.sort);
}

/** Flattened searchable text of a content item (title, summary, tags, body strings). */
export function contentText(c: Pick<SalesContent, "title" | "summary" | "tags" | "body">): string {
  const parts: string[] = [c.title, c.summary ?? "", ...c.tags];
  const walk = (v: unknown) => {
    if (typeof v === "string") parts.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(c.body);
  return parts.join(" \n ");
}
