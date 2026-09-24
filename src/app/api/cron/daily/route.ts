import { NextResponse, type NextRequest } from "next/server";
import { env, isSupabaseConfigured } from "@/lib/env";
import { supabaseService } from "@/lib/supabase/server";

/**
 * Daily job (Vercel Cron → GET with `Authorization: Bearer $CRON_SECRET`):
 *  1. release commissions whose validation window has elapsed
 *  2. schedule upcoming renewals
 * Both SQL functions are idempotent.
 */
export async function GET(req: NextRequest) {
  if (!env.cronSecret || req.headers.get("authorization") !== `Bearer ${env.cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isSupabaseConfigured) return NextResponse.json({ skipped: "supabase not configured" });
  const sb = supabaseService();
  const [released, renewals] = await Promise.all([sb.rpc("release_due_commissions"), sb.rpc("schedule_renewals", { p_horizon_days: 60 })]);
  if (released.error || renewals.error) {
    return NextResponse.json({ error: released.error?.message ?? renewals.error?.message }, { status: 500 });
  }
  return NextResponse.json({ released: released.data, renewalsScheduled: renewals.data });
}
