import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { checkoutStatus } from "@/lib/services/checkout";

/**
 * Read-only: has Stripe's payment for this Checkout Session been processed?
 * Never creates a sale — that only happens in the signed webhook.
 * Returns a status word only (no amounts, no personal data).
 */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("session_id") ?? "";
  const status = isSupabaseConfigured ? await checkoutStatus(id) : "unknown";
  return NextResponse.json({ status }, { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
}
