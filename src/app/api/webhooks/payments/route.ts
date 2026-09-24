import { NextResponse, type NextRequest } from "next/server";
import { getPaymentProvider } from "@/lib/payments";

/**
 * Payment-provider webhook. Returns 501 until a provider adapter is configured
 * (see src/lib/payments). Events must be applied idempotently via
 * sales.provider_payment_id and the SQL functions — never by trusting amounts
 * sent from a browser.
 */
export async function POST(req: NextRequest) {
  const provider = getPaymentProvider();
  if (!provider) return NextResponse.json({ error: "No payment provider configured" }, { status: 501 });
  const events = await provider.parseWebhook(await req.text(), req.headers);
  return NextResponse.json({ received: events.length });
}
