/**
 * Webhook signature verification. Pure wrapper over the Stripe SDK so it can
 * be unit-tested; the route passes the RAW request body (never re-serialised
 * JSON) and every configured endpoint secret (platform, Connect).
 */
import type Stripe from "stripe";

export class WebhookSignatureError extends Error {}

export async function verifyStripeEvent(
  stripe: Stripe,
  rawBody: string,
  signature: string | null,
  secrets: string[],
  toleranceSeconds = 300,
): Promise<Stripe.Event> {
  if (!signature) throw new WebhookSignatureError("missing stripe-signature header");
  const usable = secrets.filter(Boolean);
  if (!usable.length) throw new WebhookSignatureError("no webhook secret configured");
  for (const secret of usable) {
    try {
      return await stripe.webhooks.constructEventAsync(rawBody, signature, secret, toleranceSeconds);
    } catch {
      // try the next endpoint secret
    }
  }
  throw new WebhookSignatureError("invalid signature");
}

/** sk_test_… / rk_test_… → test, sk_live_… / rk_live_… → live. */
export function keyMode(secretKey: string): "test" | "live" | null {
  if (/^(sk|rk)_test_/.test(secretKey)) return "test";
  if (/^(sk|rk)_live_/.test(secretKey)) return "live";
  return null;
}
