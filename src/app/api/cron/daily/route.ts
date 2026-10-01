import { NextResponse, type NextRequest } from "next/server";
import { env, isSupabaseConfigured } from "@/lib/env";
import { supabaseService } from "@/lib/supabase/server";
import { flushEmailOutbox } from "@/lib/email/service";
import { log } from "@/lib/log";

/**
 * Daily job (Vercel Cron → GET with `Authorization: Bearer $CRON_SECRET`):
 *  1. release commissions whose validation period has elapsed (pending → available)
 *  2. schedule upcoming renewals (display only — no commission is ever created in advance)
 *  3. retry emails that failed or were never sent (outbox safety net)
 *  4. purge expired one-time sign-in codes
 * Every step is idempotent.
 */
export async function GET(req: NextRequest) {
  if (!env.cronSecret || req.headers.get("authorization") !== `Bearer ${env.cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isSupabaseConfigured) return NextResponse.json({ skipped: "supabase not configured" });
  const sb = supabaseService();
  const [released, renewals] = await Promise.all([sb.rpc("release_due_commissions"), sb.rpc("schedule_renewals", { p_horizon_days: 60 })]);
  if (released.error || renewals.error) {
    log.error("commissions", "daily job failed", { error: released.error?.message ?? renewals.error?.message });
    return NextResponse.json({ error: "daily job failed" }, { status: 500 });
  }
  // Emails queued by the release above are sent now; older failures are retried with backoff.
  let emails = { sent: 0, failed: 0, skipped: 0 };
  for (let i = 0; i < 10; i++) {
    const batch = await flushEmailOutbox({ limit: 50 });
    emails = { sent: emails.sent + batch.sent, failed: emails.failed + batch.failed, skipped: emails.skipped + batch.skipped };
    if (batch.sent + batch.failed + batch.skipped < 50) break;
  }
  const purged = await sb.rpc("auth_code_purge");
  if (purged.error) log.warn("auth", "sign-in code purge failed", { error: purged.error.message });
  log.info("commissions", "daily job", { released: released.data, renewals: renewals.data, ...emails, signInCodesPurged: purged.data });
  return NextResponse.json({ released: released.data, renewalsScheduled: renewals.data, emails });
}
