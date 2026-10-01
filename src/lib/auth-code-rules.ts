/**
 * Sign-in code rules, shared by the server and the login form (no Node
 * imports here). In production, Supabase Auth owns the real values (Auth →
 * Providers → Email: "Email OTP Length" and "Email OTP Expiration"); set
 * NEXT_PUBLIC_AUTH_OTP_LENGTH if the length is not 6. The demo store uses
 * the same numbers.
 */
export const CODE_LENGTH = Number(process.env.NEXT_PUBLIC_AUTH_OTP_LENGTH) || 6;
export const CODE_TTL_SECONDS = 5 * 60;
export const MAX_ATTEMPTS = 5;
export const RESEND_AFTER_SECONDS = 60;

export type CodePurpose = "login" | "signup";
