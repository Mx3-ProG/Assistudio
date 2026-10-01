/**
 * Passwordless sign-in — pure helpers (unit-tested).
 *
 * A one-time code is emailed by the app itself (Resend, no SMTP, no Supabase
 * mailer). Only a keyed hash of the code is stored; the database enforces
 * expiry, single use, the attempt limit and rate limits
 * (supabase/migrations/20261001000001_email_login_codes.sql); the shared
 * constants live in ./auth-code-rules.ts.
 */
import { createHmac, randomInt } from "node:crypto";
import { CODE_LENGTH } from "./auth-code-rules.ts";

export * from "./auth-code-rules.ts";

/** Uniformly random, zero-padded numeric code ("004217"). */
export function generateCode(): string {
  return randomInt(0, 10 ** CODE_LENGTH).toString().padStart(CODE_LENGTH, "0");
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

/** Accepts what people paste or type ("123 456", "123-456") and returns the bare digits, or null. */
export function normalizeCode(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const digits = input.replace(/[\s-]/g, "");
  return new RegExp(`^\\d{${CODE_LENGTH}}$`).test(digits) ? digits : null;
}

/** Keyed hash bound to the address: a leaked table row is useless without the secret. */
export function hashCode(email: string, code: string, secret: string): string {
  return createHmac("sha256", secret).update(`${normalizeEmail(email)}:${code}`).digest("hex");
}


/** "123456" → "123 456" (easier to read in an email). */
export const formatCode = (code: string) => (code.length === 6 ? `${code.slice(0, 3)} ${code.slice(3)}` : code);
