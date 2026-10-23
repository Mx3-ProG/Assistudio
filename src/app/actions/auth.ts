"use server";
import { createHash, randomUUID } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { env, isDemoMode } from "@/lib/env";
import { supabaseServer } from "@/lib/supabase/server";
import { repo } from "@/lib/data";
import { DEMO_SESSION_COOKIE, demoUserId } from "@/lib/data/demo";
import type { SignupData } from "@/lib/data/repo";
import { formatCode, generateCode, hashCode, normalizeCode, normalizeEmail, type CodePurpose } from "@/lib/auth-code";
import { email as emailTransport } from "@/lib/email";
import { kickEmailOutbox } from "@/lib/email/service";
import { log } from "@/lib/log";
import { recordFunnel } from "@/lib/analytics/server";
import { describeError } from "@/lib/auth-errors";
import { isLocale, localeMeta, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n";
import { fmt } from "@/i18n/format";

/**
 * Passwordless sign-in. Login and sign-up are the same two steps:
 *   1. email (+ partner application on sign-up) → the app emails a one-time
 *      code with Resend and stores only its keyed hash in Postgres;
 *   2. the code → session opened with a Supabase one-time token; the account
 *      is created on the first sign-up and its profile provisioned.
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
  /** Short, non-sensitive technical detail shown under a technical error (src/lib/auth-errors.ts). */
  detail?: string;
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

/** Salted client-network fingerprint for the database rate limit; never stores the raw IP. */
async function requestIpHash() {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip");
  return ip ? createHash("sha256").update(`${env.trackingSalt}:auth:${ip}`).digest("hex").slice(0, 32) : null;
}

/** Authentication email is synchronous: the person is waiting for this code. */
async function emailSignInCode(to: string, code: string, locale: Locale) {
  const shown = formatCode(code);
  const { emailCode: copy } = (await getDictionary(locale)).auth;
  const subject = fmt(copy.subject, { code: shown });
  const { intro, warning } = copy;
  const dir = localeMeta[locale].dir;
  await emailTransport.send({
    to, subject,
    text: `Studio ATS\n\n${intro}\n\n${shown}\n\n${warning}`,
    html: `<!doctype html><html lang="${locale}" dir="${dir}"><body style="margin:0;background:#f6f6f4;padding:40px 12px"><main style="max-width:560px;margin:auto;background:#fff;border-radius:16px;padding:48px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111"><p style="letter-spacing:.24em;font-size:13px;font-weight:600;text-transform:uppercase">Studio ATS</p><h1 style="font-size:24px;margin:40px 0 20px">${copy.title}</h1><p style="font-size:16px;line-height:1.6">${intro}</p><p style="font:600 34px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.18em">${shown}</p><p style="font-size:13px;line-height:1.6;color:#6b6b6b;margin-top:32px">${warning}</p></main></body></html>`,
    idempotencyKey: `login_code:${randomUUID()}`,
    tags: [{ name: "template", value: "auth_login_code" }],
  });
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
      application: {
        channels: d.channels,
        terms_accepted_at: new Date().toISOString(),
        terms_version: "1.0-2026-10-02",
        terms_locale: locale,
      },
    };
  }

  const code = generateCode();
  const codeHash = hashCode(email, code, env.trackingSalt);
  const base = { email, purpose };
  let res;
  try {
    res = await repo().sendSignInCode({ email, purpose, signup, codeHash, ipHash: await requestIpHash() });
  } catch (e) {
    const detail = describeError(e);
    log.error("auth", "send code failed", { detail });
    return { status: "error", error: "sendFailed", detail };
  }
  if (res.status === "rate_limited") return { status: "error", error: "rateLimited", detail: res.detail };
  if (res.status === "too_soon") return { status: "code", ...base, error: "tooSoon" };
  // "no_account" (unknown address on login): same screen, nothing sent (no account enumeration).
  if (res.status === "no_account") return { status: "code", ...base, sentAt: Date.now() };
  const demoCode = res.status === "sent" ? res.demoCode : undefined;
  if (!demoCode) {
    try {
      await emailSignInCode(email, code, locale);
    } catch (e) {
      const detail = describeError(e);
      log.error("auth", "sign-in code email failed", { detail });
      // Not sent → not issued: a retry must send a new code, not answer "too soon".
      await repo().cancelSignInCode({ email, codeHash }).catch((err) =>
        log.error("auth", "cancel unsent code failed", { detail: describeError(err) }));
      return { status: "error", error: "sendFailed", detail };
    }
  }
  if (purpose === "signup") recordFunnel({ event: "signup_started", affiliateId: null, locale });
  return { status: "code", ...base, sentAt: Date.now(), ...(demoCode ? { demoCode } : {}) };
}

async function verifyCode(prev: AuthState, form: FormData): Promise<AuthState> {
  const locale = loc(form.get("locale"));
  const email = parseEmail(form.get("email"));
  if (!email) return { status: "error", error: "invalidEmail" };
  const purpose = purposeOf(form.get("purpose"));
  const keep = { status: "code" as const, email, purpose, sentAt: prev.sentAt, demoCode: prev.demoCode, values: prev.values };

  const code = normalizeCode(form.get("code"));
  if (!code) return { ...keep, error: "codeInvalid" };
  let res;
  try {
    res = await repo().signInWithCode({ email, code, codeHash: hashCode(email, code, env.trackingSalt), purpose });
  } catch (e) {
    const detail = describeError(e);
    log.error("auth", "verify code failed", { detail });
    return { ...keep, error: "failed", detail };
  }
  if (res.status !== "ok") {
    if (res.status === "failed") return { ...keep, error: "failed", detail: res.detail };
    const errors = { invalid: "codeInvalid", expired: "codeExpired", too_many_attempts: "tooManyAttempts" } as const;
    return { ...keep, error: errors[res.status] };
  }
  if (res.isNew) {
    kickEmailOutbox(); // affiliate.welcome, queued when the account was created
    recordFunnel({ event: "signup_completed", affiliateId: null, locale });
  }
  // A new ambassador always starts with the welcome checklist; it ends on the page they came for.
  const next = safeNext(form.get("next"), locale);
  redirect(res.isNew ? `/${locale}/dashboard/welcome${next !== `/${locale}/dashboard` ? `?next=${encodeURIComponent(next)}` : ""}` : next);
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
