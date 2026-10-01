"use server";
import { createHash } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { env, isDemoMode } from "@/lib/env";
import { supabaseServer } from "@/lib/supabase/server";
import { repo } from "@/lib/data";
import { DEMO_SESSION_COOKIE, demoUserId } from "@/lib/data/demo";
import type { SignupData } from "@/lib/data/repo";
import { generateCode, hashCode, normalizeCode, normalizeEmail, type CodePurpose } from "@/lib/auth-code";
import { sendSignInCode } from "@/lib/email/auth";
import { kickEmailOutbox } from "@/lib/email/service";
import { log } from "@/lib/log";
import { isLocale, type Locale } from "@/i18n/config";

/**
 * Passwordless sign-in. Login and sign-up are the same two steps:
 *   1. email (+ partner application on sign-up) → a 6-digit code is emailed by
 *      the app itself (Resend), valid 5 minutes, single use, 5 attempts;
 *   2. the code → session opened (account created on first sign-up).
 * There are no passwords. OAuth stays available when configured.
 */
export type AuthError =
  | "invalidEmail" | "invalidForm" | "rateLimited" | "tooSoon" | "sendFailed"
  | "codeInvalid" | "codeExpired" | "tooManyAttempts" | "failed";
export type AuthState = {
  /** "code": the code step is shown (a code was sent, or would have been). */
  status: "idle" | "error" | "code";
  error?: AuthError;
  /** Invalid sign-up fields (input names). */
  fields?: string[];
  email?: string;
  purpose?: CodePurpose;
  /** When the last code was requested (ms) — drives the "resend" countdown. */
  sentAt?: number;
  /** Development mode only (no real email is sent): shown on screen, clearly labelled. */
  demoCode?: string;
  /** What was typed (React resets forms after an action; sign-up "resend" needs the application again). */
  values?: Record<string, string>;
};

const VALUE_KEYS = ["email", "fullName", "country", "channels", "sponsorCode", "terms"] as const;
const valuesOf = (form: FormData) =>
  Object.fromEntries(VALUE_KEYS.flatMap((k) => (typeof form.get(k) === "string" ? [[k, String(form.get(k)).slice(0, 500)]] : [])));

const loc = (v: FormDataEntryValue | null): Locale => (typeof v === "string" && isLocale(v) ? v : "en");
const safeNext = (v: FormDataEntryValue | null, locale: Locale) =>
  typeof v === "string" && v.startsWith("/") && !v.startsWith("//") ? v : `/${locale}/dashboard`;
const callback = (next: string) => `${env.siteUrl}/auth/callback?next=${encodeURIComponent(next)}`;
const purposeOf = (v: FormDataEntryValue | null): CodePurpose => (v === "signup" ? "signup" : "login");

const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  country: z.string().trim().max(2).optional().default(""),
  channels: z.string().trim().max(500).optional().default(""),
  sponsorCode: z.string().trim().regex(/^[A-Za-z0-9-]{3,40}$/).optional(),
  terms: z.literal("on"),
});

function parseEmail(v: FormDataEntryValue | null): string | null {
  const parsed = z.email().safeParse(String(v ?? "").trim());
  return parsed.success ? normalizeEmail(parsed.data) : null;
}

/** Salted hash of the client IP, for the per-network rate limit. Never stored raw. */
async function ipHash() {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip");
  return ip ? createHash("sha256").update(`${env.trackingSalt}:auth:${ip}`).digest("hex").slice(0, 32) : null;
}

/** One action for the whole form: intent = send | verify | edit. */
export async function codeAuth(prev: AuthState, form: FormData): Promise<AuthState> {
  const intent = form.get("intent");
  if (intent === "edit") return { status: "idle", values: valuesOf(form) };
  if (intent === "verify") return verifyCode(prev, form);
  return requestCode(form);
}

async function requestCode(form: FormData): Promise<AuthState> {
  const state = await issue(form);
  return { ...state, values: valuesOf(form) };
}

async function issue(form: FormData): Promise<AuthState> {
  const locale = loc(form.get("locale"));
  const purpose = purposeOf(form.get("purpose"));
  const email = parseEmail(form.get("email"));
  if (!email) return { status: "error", error: "invalidEmail" };

  let signup: SignupData | null = null;
  if (purpose === "signup") {
    const fields = Object.fromEntries([...form].filter(([k]) => k in registerSchema.shape));
    const parsed = registerSchema.safeParse(fields);
    if (!parsed.success) {
      return { status: "error", error: "invalidForm", fields: [...new Set(parsed.error.issues.map((i) => String(i.path[0])))] };
    }
    const d = parsed.data;
    signup = {
      full_name: d.fullName, locale, country: d.country.toUpperCase() || null, sponsor_code: d.sponsorCode ?? null,
      application: { channels: d.channels, terms_accepted_at: new Date().toISOString() },
    };
  }

  const code = generateCode();
  const base = { email, purpose };
  let result;
  try {
    result = await repo().issueSignInCode({ email, purpose, codeHash: hashCode(email, code, env.authCodeSecret), signup, ipHash: await ipHash() });
  } catch (e) {
    log.error("auth", "issue code failed", { error: e instanceof Error ? e.message : String(e) });
    return { status: "error", error: "failed" };
  }
  if (result === "rate_limited") return { status: "error", error: "rateLimited" };
  if (result === "too_soon") return { status: "code", ...base, error: "tooSoon" };
  // Unknown address on login: same screen, nothing sent (no account enumeration).
  if (result === "no_account") return { status: "code", ...base, sentAt: Date.now() };

  try {
    await sendSignInCode({ to: email, code, locale });
  } catch (e) {
    log.error("auth", "sign-in code email failed", { error: e instanceof Error ? e.message : String(e) });
    return { status: "error", error: "sendFailed" };
  }
  return { status: "code", ...base, sentAt: Date.now(), ...(isDemoMode ? { demoCode: code } : {}) };
}

async function verifyCode(prev: AuthState, form: FormData): Promise<AuthState> {
  const locale = loc(form.get("locale"));
  const email = parseEmail(form.get("email"));
  if (!email) return { status: "error", error: "invalidEmail" };
  const keep = { status: "code" as const, email, purpose: purposeOf(form.get("purpose")), sentAt: prev.sentAt, demoCode: prev.demoCode, values: prev.values };

  const code = normalizeCode(form.get("code"));
  if (!code) return { ...keep, error: "codeInvalid" };
  let res;
  try {
    res = await repo().signInWithCode({ email, codeHash: hashCode(email, code, env.authCodeSecret) });
  } catch (e) {
    log.error("auth", "verify code failed", { error: e instanceof Error ? e.message : String(e) });
    return { ...keep, error: "failed" };
  }
  if (res.status !== "ok") {
    const errors = { invalid: "codeInvalid", expired: "codeExpired", too_many_attempts: "tooManyAttempts", failed: "failed" } as const;
    return { ...keep, error: errors[res.status] };
  }
  if (res.isNew) kickEmailOutbox(); // affiliate.welcome, queued when the account was created
  redirect(res.isNew ? `/${locale}/dashboard/welcome` : safeNext(form.get("next"), locale));
}

export async function demoSignIn(form: FormData) {
  if (!isDemoMode) throw new Error("Demo mode is disabled");
  const locale = loc(form.get("locale"));
  const persona = form.get("persona") === "admin" ? "admin" : form.get("persona") === "pending" ? "pending" : "affiliate";
  (await cookies()).set(DEMO_SESSION_COOKIE, demoUserId(persona), { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 7 });
  redirect(persona === "admin" ? `/${locale}/admin` : `/${locale}/dashboard`);
}

export async function signInWithProvider(form: FormData) {
  const locale = loc(form.get("locale"));
  const provider = String(form.get("provider"));
  const allowed = (process.env.NEXT_PUBLIC_OAUTH_PROVIDERS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!allowed.includes(provider)) throw new Error("Provider not enabled");
  const sb = await supabaseServer();
  const { data, error } = await sb.auth.signInWithOAuth({
    provider: provider as "google",
    options: { redirectTo: callback(`/${locale}/dashboard`) },
  });
  if (error || !data.url) throw new Error(error?.message ?? "OAuth failed");
  redirect(data.url);
}

export async function signOut(form: FormData) {
  const locale = loc(form.get("locale"));
  if (isDemoMode) (await cookies()).delete(DEMO_SESSION_COOKIE);
  else await (await supabaseServer()).auth.signOut();
  redirect(`/${locale}`);
}
