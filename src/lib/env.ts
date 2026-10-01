/**
 * Runtime configuration. Demo mode (in-memory, clearly-labelled fake data) is
 * only ever allowed outside production: it is ON automatically in local dev
 * when Supabase isn't configured, and can be forced for preview deployments
 * with STUDIO_DEMO_MODE=true. It can never run on the production deployment.
 *
 * Server secrets (service role, Stripe secret/webhook, Resend) are read here
 * but this module never exposes them through NEXT_PUBLIC_*: Next only inlines
 * NEXT_PUBLIC_ variables into client bundles.
 */
import { DEFAULT_EMAIL_FROM, DEFAULT_EMAIL_REPLY_TO, orDefault } from "./email/transport";

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  supabaseServiceKey: process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  siteUrl: (process.env.APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  trackingSalt: process.env.TRACKING_HASH_SALT ?? "dev-only-salt",
  /** Key for hashing one-time sign-in codes (falls back to the tracking salt). */
  authCodeSecret: process.env.AUTH_CODE_SECRET || process.env.TRACKING_HASH_SALT || "dev-only-auth-code-secret",
  cronSecret: process.env.CRON_SECRET ?? "",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecrets: [process.env.STRIPE_WEBHOOK_SECRET ?? "", process.env.STRIPE_CONNECT_WEBHOOK_SECRET ?? ""].filter(Boolean),
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  emailFrom: orDefault(process.env.EMAIL_FROM, DEFAULT_EMAIL_FROM),
  emailReplyTo: orDefault(process.env.EMAIL_REPLY_TO, DEFAULT_EMAIL_REPLY_TO),
};

export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey);
export const isStripeConfigured = Boolean(env.stripeSecretKey);

export const isProductionDeployment =
  process.env.VERCEL_ENV === "production" ||
  (process.env.NODE_ENV === "production" && !process.env.VERCEL_ENV && process.env.STUDIO_DEMO_MODE !== "true");

export const isDemoMode =
  !isProductionDeployment && (process.env.STUDIO_DEMO_MODE === "true" || !isSupabaseConfigured);

export function assertConfigured() {
  if (!isSupabaseConfigured && !isDemoMode) {
    throw new Error("Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).");
  }
}
