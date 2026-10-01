/**
 * Transport choice — pure (unit-tested). Kept apart from index.ts so it can be
 * tested without the server runtime.
 */
export const DEFAULT_EMAIL_FROM = "Studio ATS <contact@atonservice.org>";
export const DEFAULT_EMAIL_REPLY_TO = "contact@atonservice.org";

/**
 * - "resend": a key is configured → real delivery.
 * - "log": no key outside production → logged only (local dev, demo).
 * - "missing": no key on production → every send fails loudly, so the outbox
 *   marks the email `failed` and retries it once the key is set, instead of
 *   recording an email that never left as "sent".
 */
export type TransportKind = "resend" | "log" | "missing";
export function chooseTransport(hasKey: boolean, isProduction: boolean): TransportKind {
  if (hasKey) return "resend";
  return isProduction ? "missing" : "log";
}

/** Empty or blank env values fall back to the default (Vercel can hold "" for an unset field). */
export const orDefault = (value: string | undefined, fallback: string) => (value && value.trim() ? value.trim() : fallback);
