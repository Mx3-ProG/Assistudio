/**
 * Sign-in code rules, shared by the server and the login form (no Node
 * imports here). Keep in sync with supabase/migrations/20261001000001_email_login_codes.sql.
 */
export const CODE_LENGTH = 6;
export const CODE_TTL_SECONDS = 5 * 60;
export const MAX_ATTEMPTS = 5;
export const RESEND_AFTER_SECONDS = 60;

export type CodePurpose = "login" | "signup";
