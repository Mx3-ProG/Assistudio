"use server";

import { z } from "zod";
import { isLocale } from "@/i18n/config";
import { isSupabaseConfigured } from "@/lib/env";
import { kickEmailOutbox, queuePublicEmail } from "@/lib/email/service";
import { log } from "@/lib/log";
import { supabaseService } from "@/lib/supabase/server";

const schema = z.object({
  email: z.email().max(200),
  locale: z.string(),
  source: z.enum(["home", "contact"]).default("home"),
  consent: z.literal("on"),
  website_url: z.string().max(0).optional().default(""),
});

export type NewsletterState = { status: "idle" | "success" | "error"; fields?: string[] };

export async function subscribeNewsletter(_previous: NewsletterState, form: FormData): Promise<NewsletterState> {
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) {
    if (form.get("website_url")) return { status: "success" };
    return { status: "error", fields: parsed.error.issues.map((issue) => String(issue.path[0])) };
  }

  if (!isSupabaseConfigured) return { status: "success" };

  const { email, source } = parsed.data;
  const locale = isLocale(parsed.data.locale) ? parsed.data.locale : "en";
  const consentAt = new Date().toISOString();
  const sb = supabaseService();
  const { data, error } = await sb.from("newsletter_subscriptions").upsert({
    email: email.toLowerCase(),
    locale,
    source,
    status: "subscribed",
    consent_at: consentAt,
    unsubscribed_at: null,
  }, { onConflict: "email" }).select("id").single();

  if (error || !data?.id) {
    log.error("newsletter", "subscription failed", { error: error?.message ?? "missing id" });
    return { status: "error" };
  }

  try {
    await queuePublicEmail({
      to: email,
      locale,
      template: "newsletter.confirmation",
      key: `newsletter.confirmation:${data.id}:${consentAt}`,
      recipientType: "lead",
      relatedEntity: "newsletter_subscription",
      relatedId: data.id,
      params: {},
    });
  } catch (mailError) {
    log.error("newsletter", "confirmation queue failed", { subscription_id: data.id, error: mailError instanceof Error ? mailError.message : String(mailError) });
  }
  kickEmailOutbox();
  return { status: "success" };
}
