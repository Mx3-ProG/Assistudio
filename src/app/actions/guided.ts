"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { repo, getSession } from "@/lib/data";
import type { Session, ProspectStage } from "@/lib/data/types";
import { PROSPECT_STAGES } from "@/lib/data/types";
import { locales, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n";
import { fmt } from "@/i18n/format";
import { GUIDE_EVENTS, KEY_PATTERN, pickLocale, type ReplyBody } from "@/lib/sales/content";
import { marketContent } from "@/content/markets";

/**
 * Guided pipeline actions (V0.5). They only move the prospect in the single
 * CRM and append to its history; the affiliate id always comes from the
 * session, ownership is re-checked by the repository and by RLS.
 */
type AffiliateSession = Session & { affiliate: NonNullable<Session["affiliate"]> };
async function affiliateSession(): Promise<AffiliateSession> {
  const s = await getSession();
  if (!s?.affiliate) throw new Error("Unauthorized");
  return s as AffiliateSession;
}
const refresh = () => revalidatePath("/[locale]/dashboard", "layout");
const stageSchema = z.enum(PROSPECT_STAGES as [ProspectStage, ...ProspectStage[]]);
const localeSchema = z.enum(locales).catch("en");
const RELATIONS = ["close", "acquaintance", "professional", "cold"] as const;

async function ownedProspect(s: AffiliateSession, id: string) {
  const p = (await repo().listProspects(s)).find((x) => x.id === z.string().min(1).max(64).parse(id));
  if (!p) throw new Error("not_found");
  return p;
}

/** "I have someone in mind": creates the prospect at the right stage and opens its guided page. */
export async function startProspect(form: FormData) {
  const s = await affiliateSession();
  const d = z.object({
    name: z.string().trim().min(2).max(120),
    company: z.string().trim().max(160).optional().default(""),
    sector: z.string().regex(KEY_PATTERN).optional().or(z.literal("")),
    relation: z.enum(RELATIONS).catch("acquaintance"),
    state: z.enum(["new", "contacted", "interested"]).catch("new"),
    locale: localeSchema,
  }).parse(Object.fromEntries(form));
  const markets = await repo().listMarkets();
  const market = d.sector ? markets.find((m) => m.slug === d.sector) : undefined;
  const p = await repo().createProspect(s, {
    name: d.name, company: d.company || null, profession: market ? marketContent(market, d.locale).name : null,
    email: null, phone: null, website: null, notes: null, source: null, campaignId: null, marketId: market?.id ?? null,
    stage: d.state, nextAction: null, nextActionAt: null, potentialValueCents: null,
  });
  await repo().addProspectEvent(s, p.id, "created", p.stage, { relation: d.relation });
  if (d.state !== "new") await repo().addProspectEvent(s, p.id, d.state === "contacted" ? "message_sent" : "interest", p.stage);
  refresh();
  redirect(`/${d.locale}/dashboard/prospects/${p.id}`);
}

/** An outcome button of the current step ("I sent the message", "They replied"…). */
export async function advanceProspect(id: string, to: string, event: string) {
  const s = await affiliateSession();
  const p = await ownedProspect(s, id);
  const stage = stageSchema.parse(to);
  const type = z.enum(GUIDE_EVENTS).parse(event);
  if (stage === "handed_off") throw new Error("use_hand_off_form"); // Studio must receive the hand-over message
  // The planned action belonged to the previous step: the guidance takes over.
  await repo().updateProspect(s, p.id, stage === p.stage ? { nextAction: null, nextActionAt: null } : { stage, nextAction: null, nextActionAt: null });
  await repo().addProspectEvent(s, p.id, type, stage, { from: p.stage });
  refresh();
}

/** "They said…": logs the reply; moves the prospect when the reply says so (never to Studio without the hand-over form). */
export async function applyReply(id: string, replyKey: string, locale: string) {
  const s = await affiliateSession();
  const p = await ownedProspect(s, id);
  const content = await repo().listSalesContent(s, ["reply"]);
  const reply = pickLocale(content, localeSchema.parse(locale)).find((c) => c.key === z.string().regex(KEY_PATTERN).parse(replyKey));
  if (!reply) throw new Error("not_found");
  const to = (reply.body as ReplyBody).to;
  const move = to && to !== "handed_off" && to !== p.stage ? to : null;
  if (move) await repo().updateProspect(s, p.id, { stage: move, nextAction: null, nextActionAt: null });
  await repo().addProspectEvent(s, p.id, "reply_received", move ?? p.stage, { reply: reply.key });
  refresh();
  return { handOff: to === "handed_off" };
}

/** "Call me back later": the date becomes the prospect's planned action (the copilot reminds it). */
export async function planProspect(id: string, label: string, at: string) {
  const s = await affiliateSession();
  const p = await ownedProspect(s, id);
  const when = z.iso.datetime({ offset: true }).or(z.iso.date()).parse(at);
  await repo().updateProspect(s, p.id, { nextAction: z.string().trim().min(1).max(200).parse(label), nextActionAt: new Date(when).toISOString() });
  refresh();
}

export type HandOffState = { ok?: boolean; error?: string };

/**
 * Hand the prospect over to Studio. The prospect stays in the ambassador's CRM
 * and attributed to them; Studio receives a structured message in the
 * ambassador's Support thread. Contact details are shared only with the
 * prospect's agreement.
 */
export async function handOffProspect(_: HandOffState, form: FormData): Promise<HandOffState> {
  const s = await affiliateSession();
  const d = z.object({
    id: z.string().min(1).max(64),
    reason: z.enum(["technical", "contract", "quote", "meeting", "price", "unknown", "other"]),
    note: z.string().trim().max(1500).optional().default(""),
    consent: z.string().optional().transform((v) => v === "on"),
    locale: localeSchema,
  }).safeParse(Object.fromEntries(form));
  if (!d.success) return { error: "invalid" };
  const { id, reason, note, consent, locale } = d.data;
  const p = await ownedProspect(s, id);
  const t = await getDictionary(locale as Locale);
  const H = t.gd.handoff;
  const markets = await repo().listMarkets();
  const market = markets.find((m) => m.id === p.marketId);
  const lines = [
    fmt(H.messageTitle, { name: p.name }),
    p.company && `${H.fields.company} : ${p.company}`,
    market && `${H.fields.sector} : ${marketContent(market, locale as Locale).name}`,
    `${H.fields.stage} : ${t.dash.prospects.stages[p.stage]}`,
    `${H.fields.reason} : ${H.reasons[reason]}`,
    note && `${H.fields.note} : ${note}`,
    consent ? [p.email && `${H.fields.email} : ${p.email}`, p.phone && `${H.fields.phone} : ${p.phone}`].filter(Boolean).join("\n") || H.noContact : H.noConsent,
    fmt(H.attribution, { code: s.affiliate.code }),
  ].filter(Boolean).join("\n");
  try {
    const conversationId = await repo().openSupportConversation(s);
    await repo().sendMessage(s, { conversationId, kind: "text", body: lines.slice(0, 4000) });
  } catch {
    return { error: "message" };
  }
  await repo().updateProspect(s, p.id, { stage: "handed_off", nextAction: null, nextActionAt: null });
  await repo().addProspectEvent(s, p.id, "handed_off", "handed_off", { reason, consent });
  refresh();
  return { ok: true };
}
