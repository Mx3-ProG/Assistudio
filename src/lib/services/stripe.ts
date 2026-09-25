import "server-only";
import Stripe from "stripe";
import { env, isProductionDeployment } from "@/lib/env";
import { keyMode } from "@/lib/stripe/verify";

/**
 * StripeService — the only place that holds the Stripe secret key.
 *
 * Test and live never mix: a live key is refused outside the production
 * deployment, a test key is refused on production (unless explicitly allowed
 * for a staging project), and events whose `livemode` does not match the key
 * are ignored by the webhook.
 */
let client: Stripe | null = null;

export function stripeMode(): "test" | "live" {
  const mode = keyMode(env.stripeSecretKey);
  if (!mode) throw new Error("STRIPE_SECRET_KEY is missing or is not a secret/restricted key");
  return mode;
}

export function stripe(): Stripe {
  if (client) return client;
  const mode = stripeMode();
  if (mode === "live" && !isProductionDeployment) {
    throw new Error("Refusing a live Stripe key outside the production deployment");
  }
  if (mode === "test" && isProductionDeployment && process.env.STRIPE_ALLOW_TEST_MODE_IN_PRODUCTION !== "true") {
    throw new Error("Refusing a test Stripe key on the production deployment");
  }
  client = new Stripe(env.stripeSecretKey, {
    appInfo: { name: "Studio ATS", version: "0.2.0" },
    maxNetworkRetries: 2,
    timeout: 20_000,
  });
  return client;
}

/** Stripe Checkout supports these locales; anything else lets Stripe decide. */
const CHECKOUT_LOCALES = new Set(["en", "fr", "de", "es", "pt", "it", "nl"]);
export function checkoutLocale(locale: string): Stripe.Checkout.SessionCreateParams.Locale {
  return (CHECKOUT_LOCALES.has(locale) ? locale : "auto") as Stripe.Checkout.SessionCreateParams.Locale;
}
