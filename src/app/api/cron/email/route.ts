import { NextResponse, type NextRequest } from "next/server";
import { env, isSupabaseConfigured } from "@/lib/env";
import { flushEmailOutbox } from "@/lib/email/service";
import { log } from "@/lib/log";

/**
 * Independent outbox safety net. Email delivery must not be blocked by the
 * commission/renewal maintenance performed by the daily business cron.
 */
export async function GET(req: NextRequest) {
  if (!env.cronSecret || req.headers.get("authorization") !== `Bearer ${env.cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isSupabaseConfigured) return NextResponse.json({ skipped: "supabase not configured" });

  const emails = { sent: 0, failed: 0, skipped: 0 };
  for (let i = 0; i < 10; i++) {
    const batch = await flushEmailOutbox({ limit: 50 });
    emails.sent += batch.sent;
    emails.failed += batch.failed;
    emails.skipped += batch.skipped;
    if (batch.sent + batch.failed + batch.skipped < 50) break;
  }
  log.info("email", "outbox cron", emails);
  return NextResponse.json({ emails });
}
