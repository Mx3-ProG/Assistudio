"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { env, isDemoMode } from "@/lib/env";
import { supabaseServer } from "@/lib/supabase/server";
import { DEMO_SESSION_COOKIE, demoUserId } from "@/lib/data/demo";
import { isLocale, type Locale } from "@/i18n/config";

export type AuthState = { status: "idle" | "error" | "sent"; message?: string; email?: string };

/** Supabase auth errors → dictionary keys (t.auth.*). Never echoes whether an account exists. */
type AuthErrorKey = "invalid" | "unconfirmed" | "rateLimited" | "unavailable" | "samePassword" | "weakPassword";
function authErrorKey(error: { code?: string; status?: number } | null): AuthErrorKey {
  const code = error?.code ?? "";
  if (code === "email_not_confirmed") return "unconfirmed";
  if (code === "same_password") return "samePassword";
  if (code === "weak_password") return "weakPassword";
  if (code.startsWith("over_") || error?.status === 429) return "rateLimited";
  if (!error?.status || error.status >= 500) return "unavailable";
  return "invalid";
}

const loc = (v: FormDataEntryValue | null): Locale => (typeof v === "string" && isLocale(v) ? v : "en");
const safeNext = (v: FormDataEntryValue | null, locale: Locale) =>
  typeof v === "string" && v.startsWith("/") && !v.startsWith("//") ? v : `/${locale}/dashboard`;
const callback = (next: string) => `${env.siteUrl}/auth/callback?next=${encodeURIComponent(next)}`;

export async function demoSignIn(form: FormData) {
  if (!isDemoMode) throw new Error("Demo mode is disabled");
  const locale = loc(form.get("locale"));
  const persona = form.get("persona") === "admin" ? "admin" : form.get("persona") === "pending" ? "pending" : "affiliate";
  (await cookies()).set(DEMO_SESSION_COOKIE, demoUserId(persona), { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 7 });
  redirect(persona === "admin" ? `/${locale}/admin` : `/${locale}/dashboard`);
}

export async function signIn(_prev: AuthState, form: FormData): Promise<AuthState> {
  const locale = loc(form.get("locale"));
  const next = safeNext(form.get("next"), locale);
  const email = z.email().safeParse(form.get("email"));
  if (!email.success) return { status: "error", message: "invalid" };
  const sb = await supabaseServer();

  if (form.get("intent") === "resend") {
    const { error } = await sb.auth.resend({ type: "signup", email: email.data, options: { emailRedirectTo: callback(`/${locale}/dashboard/welcome`) } });
    return error && authErrorKey(error) !== "invalid" ? { status: "error", message: authErrorKey(error), email: email.data } : { status: "sent" };
  }
  if (form.get("mode") === "magic") {
    const { error } = await sb.auth.signInWithOtp({ email: email.data, options: { emailRedirectTo: callback(next), shouldCreateUser: false } });
    return error ? { status: "error", message: authErrorKey(error), email: email.data } : { status: "sent" };
  }
  const password = String(form.get("password") ?? "");
  const { error } = await sb.auth.signInWithPassword({ email: email.data, password });
  if (error) return { status: "error", message: authErrorKey(error), email: email.data };
  redirect(next);
}

const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.email(),
  password: z.string().min(10).max(200),
  country: z.string().trim().max(2).optional().default(""),
  channels: z.string().trim().max(500).optional().default(""),
  sponsorCode: z.string().trim().regex(/^[A-Za-z0-9-]{3,40}$/).optional(),
  terms: z.literal("on"),
});

export async function signUp(_prev: AuthState, form: FormData): Promise<AuthState> {
  const locale = loc(form.get("locale"));
  const parsed = registerSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { status: "error", message: parsed.error.issues.map((i) => i.path[0]).join(", ") };
  const d = parsed.data;
  const sb = await supabaseServer();
  const { error } = await sb.auth.signUp({
    email: d.email,
    password: d.password,
    options: {
      emailRedirectTo: callback(`/${locale}/dashboard/welcome`),
      // Read by the handle_new_user() trigger → profile + affiliate application.
      data: { full_name: d.fullName, locale, country: d.country.toUpperCase() || null, sponsor_code: d.sponsorCode ?? null, application: { channels: d.channels, terms_accepted_at: new Date().toISOString() } },
    },
  });
  return error ? { status: "error", message: error.message } : { status: "sent" };
}

export async function forgotPassword(_prev: AuthState, form: FormData): Promise<AuthState> {
  const locale = loc(form.get("locale"));
  const email = z.email().safeParse(form.get("email"));
  if (!email.success) return { status: "error", message: "invalid" };
  const sb = await supabaseServer();
  await sb.auth.resetPasswordForEmail(email.data, { redirectTo: callback(`/${locale}/reset`) });
  // Same answer whether or not the account exists (no user enumeration).
  return { status: "sent" };
}

/** Lands here from the recovery email (via /auth/callback, which opened a session). */
export async function updatePassword(_prev: AuthState, form: FormData): Promise<AuthState> {
  const locale = loc(form.get("locale"));
  const password = String(form.get("password") ?? "");
  if (password.length < 10 || password.length > 200) return { status: "error", message: "passwordTooShort" };
  if (password !== String(form.get("confirm") ?? "")) return { status: "error", message: "passwordMismatch" };
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { status: "error", message: "linkExpired" };
  const { error } = await sb.auth.updateUser({ password });
  if (error) return { status: "error", message: authErrorKey(error) };
  redirect(`/${locale}/dashboard`);
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
