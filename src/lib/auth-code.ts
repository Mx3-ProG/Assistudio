/**
 * Passwordless sign-in — pure helpers (unit-tested).
 *
 * In production Supabase Auth generates, emails and checks the code
 * (signInWithOtp / verifyOtp). These helpers normalise what people type and
 * generate codes for the in-memory demo store. Shared constants live in
 * ./auth-code-rules.ts.
 */
import { createHmac, randomInt } from "node:crypto";
import { CODE_LENGTH } from "./auth-code-rules.ts";

export * from "./auth-code-rules.ts";

/** Uniformly random, zero-padded numeric code ("004217"). */
export function generateCode(): string {
  return randomInt(0, 10 ** CODE_LENGTH).toString().padStart(CODE_LENGTH, "0");
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

/**
 * Accepts what people paste or type ("123 456", "123-456") and returns the bare
 * digits, or null. 6 to 10 digits: the OTP length is a Supabase Auth setting.
 */
export function normalizeCode(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const digits = input.replace(/[\s-]/g, "");
  return /^\d{6,10}$/.test(digits) ? digits : null;
}

/** Keyed hash bound to the address: database rows never contain a usable code. */
export function hashCode(email: string, code: string, secret: string): string {
  return createHmac("sha256", secret).update(`auth-code:${normalizeEmail(email)}:${code}`).digest("hex");
}

/** "123456" → "123 456" (easier to read in an email). */
export const formatCode = (code: string) => (code.length === 6 ? `${code.slice(0, 3)} ${code.slice(3)}` : code);
