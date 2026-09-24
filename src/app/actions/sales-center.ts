"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { repo, getSession } from "@/lib/data";
import type { Session } from "@/lib/data/types";
import { locales } from "@/i18n/config";
import { CTA_MODES, CHANNELS, KEY_PATTERN } from "@/lib/sales/content";
import { cleanAdvisor } from "@/lib/sales/landing";
import { GENERAL_PATH } from "@/lib/sales/server";
import type { FormState } from "./dashboard";

/**
 * Sales Center actions. The affiliate id ALWAYS comes from the server session;
 * ownership is re-checked by the repository and by RLS / SQL guards.
 */
async function affiliateSession(): Promise<Session & { affiliate: NonNullable<Session["affiliate"]> }> {
  const s = await getSession();
  if (!s?.affiliate) throw new Error("Unauthorized");
  return s as Session & { affiliate: NonNullable<Session["affiliate"]> };
}
const refresh = () => revalidatePath("/[locale]/dashboard", "layout");
const keySchema = z.string().regex(KEY_PATTERN);

export async function toggleFavorite(kind: string, key: string, on: boolean) {
  const s = await affiliateSession();
  await repo().setFavorite(s, z.string().regex(/^[a-z_]{1,40}$/).parse(kind), keySchema.parse(key), on);
  refresh();
}

export async function setProgress(itemKey: string, done: boolean) {
  const s = await affiliateSession();
  await repo().setProgress(s, keySchema.parse(itemKey), done);
  refresh();
}

/** Usage analytics (views, copies, shares). Best-effort: never blocks the UI. */
export async function trackUsage(event: "content_view" | "content_copy" | "page_share" | "start_selling" | "playbook_open", ref: { kind?: string; key?: string; target?: string; channel?: string; pageId?: string }) {
  const s = await getSession();
  if (!s?.affiliate) return;
  const k = ref.key && KEY_PATTERN.test(ref.key) ? ref.key : null;
  await repo().recordSalesEvent({
    event: z.enum(["content_view", "content_copy", "page_share", "start_selling", "playbook_open"]).parse(event),
    affiliateId: s.affiliate.id,
    contentKind: k && ref.kind && /^[a-z_]{1,40}$/.test(ref.kind) ? ref.kind : null,
    contentKey: k,
    targetKey: ref.target && KEY_PATTERN.test(ref.target) ? ref.target : null,
    channel: ref.channel && (CHANNELS as readonly string[]).includes(ref.channel) ? ref.channel : null,
    privatePageId: ref.pageId && /^[\w-]{1,64}$/.test(ref.pageId) ? ref.pageId : null,
  }).catch(() => undefined);
}

const pageSchema = z.object({
  id: z.string().max(64).optional(),
  marketId: z.string().max(64).optional().transform((v) => v || null),
  pathKey: z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9-]{0,39}$/),
  locale: z.enum(locales),
  templateKey: keySchema,
  angleKey: z.string().optional().transform((v) => (v && KEY_PATTERN.test(v) ? v : null)),
  ctaMode: z.enum(CTA_MODES),
  showAdvisor: z.string().optional().transform((v) => v === "on"),
  advisorName: z.string().trim().max(80).optional(),
  advisorTitle: z.string().trim().max(80).optional(),
  advisorEmail: z.union([z.email().max(200), z.literal("")]).optional(),
  advisorPhone: z.string().trim().max(40).optional(),
  campaignId: z.string().max(64).optional().transform((v) => v || null),
});

export type PageFormState = FormState & { pageId?: string; url?: string };

export async function saveSalesPage(_: PageFormState, form: FormData): Promise<PageFormState> {
  const s = await affiliateSession();
  const d = pageSchema.safeParse(Object.fromEntries(form));
  if (!d.success) return { error: "invalid" };
  const r = repo();
  const [markets, content, sales] = await Promise.all([r.listMarkets(), r.listSalesContent(s, ["page_template", "sales_angle"]), r.getSalesSettings()]);
  // Only published, brand-approved building blocks; only real targets.
  if (d.data.marketId && !markets.some((m) => m.id === d.data.marketId)) return { error: "invalid" };
  if (!content.some((c) => c.kind === "page_template" && c.key === d.data.templateKey)) return { error: "invalid" };
  if (d.data.angleKey && !content.some((c) => c.kind === "sales_angle" && c.key === d.data.angleKey)) return { error: "invalid" };
  const advisor = cleanAdvisor({
    name: d.data.advisorName || (s.displayName || s.fullName), title: d.data.advisorTitle, email: d.data.advisorEmail, phone: d.data.advisorPhone,
  });
  const input = {
    marketId: d.data.marketId,
    pathKey: d.data.marketId ? d.data.pathKey : GENERAL_PATH,
    locale: d.data.locale, templateKey: d.data.templateKey, angleKey: d.data.angleKey, ctaMode: d.data.ctaMode,
    showAdvisor: d.data.showAdvisor && sales.advisorEnabled,
    advisor: Object.fromEntries(Object.entries(advisor ?? {}).filter(([, v]) => v)) as Record<string, string>,
    campaignId: d.data.campaignId,
  };
  try {
    if (d.data.id) {
      await r.updateSalesPage(s, d.data.id, input);
      refresh();
      return { ok: true, pageId: d.data.id };
    }
    const page = await r.createSalesPage(s, input);
    refresh();
    return { ok: true, pageId: page.id };
  } catch (e) {
    return { error: e instanceof Error && e.message === "path_taken" ? "path_taken" : "generic" };
  }
}

export async function archiveSalesPage(id: string) {
  const s = await affiliateSession();
  await repo().archiveSalesPage(s, z.string().max(64).parse(id));
  refresh();
}

export async function createLink(_: FormState, form: FormData): Promise<FormState> {
  const s = await affiliateSession();
  const d = z.object({
    name: z.string().trim().min(1).max(120),
    pageId: z.string().max(64).optional().transform((v) => v || null),
    marketId: z.string().max(64).optional().transform((v) => v || null),
    channel: z.enum(CHANNELS).optional().or(z.literal("")).transform((v) => v || null),
  }).safeParse(Object.fromEntries(form));
  if (!d.success) return { error: "invalid" };
  try {
    await repo().createLink(s, d.data);
  } catch {
    return { error: "invalid" };
  }
  refresh();
  return { ok: true };
}
