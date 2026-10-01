import "server-only";
import { env, isSupabaseConfigured } from "@/lib/env";
import { log } from "@/lib/log";
import { supabaseService } from "@/lib/supabase/server";
import { email } from "./index";
import { renderEmail } from "./templates";
import { TEMPLATE_IDS, type TemplateId } from "./copy";
import type { Locale } from "@/i18n/config";

/**
 * EmailService — the only entry point for transactional email.
 *
 * Emails are written to the `email_events` outbox by the database, in the same
 * transaction as the fact they describe (sale, commission, payout…). This
 * service sends them after commit:
 *   - fast path: right after a webhook is processed (`after()`),
 *   - safety net: the cron retries failed / stuck ones with backoff.
 * A failed email never rolls back or blocks a financial operation.
 */
export async function flushEmailOutbox(opts: { limit?: number; ids?: string[] } = {}): Promise<{ sent: number; failed: number; skipped: number }> {
  const stats = { sent: 0, failed: 0, skipped: 0 };
  if (!isSupabaseConfigured) return stats;
  const sb = supabaseService();
  const { data, error } = await sb.rpc("email_claim_batch", { p_limit: opts.limit ?? 25, p_ids: opts.ids ?? null });
  if (error) {
    log.error("email", "claim failed", { error: error.message });
    return stats;
  }
  for (const row of (data ?? []) as {
    id: string; template: string; to_email: string | null; locale: string; params: Record<string, unknown>; idempotency_key: string;
  }[]) {
    const mark = (status: "sent" | "failed" | "skipped", providerId: string | null, err: string | null) =>
      sb.rpc("email_mark", { p_id: row.id, p_status: status, p_provider: email.name, p_provider_message_id: providerId, p_error: err });

    if (!row.to_email || !TEMPLATE_IDS.includes(row.template as TemplateId)) {
      await mark("skipped", null, !row.to_email ? "no recipient address" : "unknown template");
      stats.skipped++;
      continue;
    }
    try {
      const rendered = renderEmail(row.template as TemplateId, row.params ?? {}, { locale: row.locale, appUrl: env.siteUrl });
      const res = await email.send({
        to: row.to_email, ...rendered, idempotencyKey: row.idempotency_key,
        tags: [{ name: "template", value: row.template.replace(/[^a-zA-Z0-9_-]/g, "_") }],
      });
      await mark("sent", res.id, null);
      stats.sent++;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      await mark("failed", null, message);
      log.error("email", "send failed", { email_event_id: row.id, template: row.template, error: message });
      stats.failed++;
    }
  }
  return stats;
}

/** Queue a pre-contract email before a lead/customer row exists. */
export async function queueDirectEmail(input: {
  to: string;
  locale: Locale;
  template: TemplateId;
  key: string;
  dossierId: string;
  params: Record<string, unknown>;
}): Promise<void> {
  if (!isSupabaseConfigured) return;
  const sb = supabaseService();
  const { data, error } = await sb.from("email_events").upsert({
    idempotency_key: input.key,
    template: input.template,
    recipient_type: "lead",
    recipient_email: input.to.toLowerCase(),
    related_entity: "commercial_dossier",
    related_id: input.dossierId,
    params: { ...input.params, locale: input.locale },
  }, { onConflict: "idempotency_key", ignoreDuplicates: true }).select("id").maybeSingle();
  if (error) throw new Error(`queue dossier email: ${error.message}`);
  if (data?.id) await flushEmailOutbox({ ids: [data.id] });
}
