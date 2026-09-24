import { NextResponse, after, type NextRequest } from "next/server";
import { env, isStripeConfigured, isSupabaseConfigured } from "@/lib/env";
import { log } from "@/lib/log";
import { stripe } from "@/lib/services/stripe";
import { handleStripeEvent } from "@/lib/services/stripe-webhook";
import { verifyStripeEvent, WebhookSignatureError } from "@/lib/stripe/verify";
import { flushEmailOutbox } from "@/lib/email/service";

/**
 * Stripe webhook — the only way a payment becomes a sale in STUDIO.
 *
 *  - raw body + `stripe-signature` verified against the endpoint secret(s)
 *  - 400 on a bad signature (Stripe will not retry a forged request forever)
 *  - 200 on processed / duplicate / ignored
 *  - 409 while the same event is being processed elsewhere, 500 on failure:
 *    Stripe retries with backoff, and processing is idempotent.
 */
export async function POST(req: NextRequest) {
  if (!isStripeConfigured || !isSupabaseConfigured || env.stripeWebhookSecrets.length === 0) {
    return NextResponse.json({ error: "stripe webhook not configured" }, { status: 503 });
  }

  const raw = await req.text();
  let event;
  try {
    event = await verifyStripeEvent(stripe(), raw, req.headers.get("stripe-signature"), env.stripeWebhookSecrets);
  } catch (e) {
    if (e instanceof WebhookSignatureError) {
      log.warn("webhook", "rejected: signature", { reason: e.message });
      return NextResponse.json({ error: "invalid signature" }, { status: 400 });
    }
    throw e;
  }

  try {
    const outcome = await handleStripeEvent(event);
    if (outcome === "in_progress") return NextResponse.json({ status: outcome }, { status: 409 });
    if (outcome === "processed") {
      // Emails were committed with the financial fact; send them after the response.
      after(() => flushEmailOutbox({ limit: 20 }).catch((e) => log.error("email", "flush failed", { error: e })));
    }
    return NextResponse.json({ status: outcome });
  } catch {
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }
}
