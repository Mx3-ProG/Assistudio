"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { MailCheck } from "lucide-react";
import { signIn, signUp, signOut, forgotPassword, updatePassword, demoSignIn, signInWithProvider, type AuthState } from "@/app/actions/auth";
import { useI18n } from "@/components/providers";
import { Field, inputClass, Notice } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";

function Shell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="w-full max-w-[420px] animate-rise">
      <h1 className="text-[32px] font-semibold tracking-[-0.035em]">{title}</h1>
      <p className="mt-2 text-[15px] text-muted">{subtitle}</p>
      <div className="card mt-8 p-6 shadow-soft sm:p-7">{children}</div>
    </div>
  );
}

type AuthDict = ReturnType<typeof useI18n>["t"]["auth"];
const MESSAGE_KEYS = [
  "invalid", "unconfirmed", "rateLimited", "unavailable", "linkExpired", "accountUnavailable",
  "passwordMismatch", "passwordTooShort", "samePassword", "weakPassword",
] as const;
export type AuthNotice = (typeof MESSAGE_KEYS)[number];
const authMessage = (t: AuthDict, key?: string) =>
  t[(MESSAGE_KEYS as readonly string[]).includes(key ?? "") ? (key as AuthNotice) : "invalid"];

function Sent() {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <MailCheck className="size-10 text-success" />
      <p className="text-[15px]">{t.auth.checkEmail}</p>
    </div>
  );
}

export function DemoAccess() {
  const { t, locale } = useI18n();
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-warning/60 bg-warning-soft p-4">
      <p className="text-[13px] font-semibold">{t.auth.demoTitle}</p>
      <p className="mt-1 text-[12.5px] text-fg-2">{t.auth.demoBody}</p>
      <div className="mt-3 grid gap-2">
        {(["affiliate", "admin"] as const).map((persona) => (
          <form key={persona} action={demoSignIn}>
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="persona" value={persona} />
            <button className={buttonClass(persona === "affiliate" ? "primary" : "secondary", "md", "w-full")}>
              {persona === "affiliate" ? t.auth.demoAffiliate : t.auth.demoAdmin}
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}

function Providers() {
  const { locale } = useI18n();
  const providers = (process.env.NEXT_PUBLIC_OAUTH_PROVIDERS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!providers.length) return null;
  return (
    <div className="mt-4 grid gap-2">
      {providers.map((p) => (
        <form key={p} action={signInWithProvider}>
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="provider" value={p} />
          <button className={buttonClass("secondary", "md", "w-full capitalize")}>{p}</button>
        </form>
      ))}
    </div>
  );
}

export function LoginForm({ demo, next, notice }: { demo: boolean; next?: string; notice?: AuthNotice }) {
  const { t, locale } = useI18n();
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [state, action, pending] = useActionState<AuthState, FormData>(signIn, { status: "idle" });
  return (
    <Shell title={t.auth.loginTitle} subtitle={t.auth.loginSubtitle}>
      {notice && state.status === "idle" && (
        <div className="mb-4 grid gap-3">
          <Notice tone="warning">{authMessage(t.auth, notice)}</Notice>
          {notice === "accountUnavailable" && (
            <form action={signOut}>
              <input type="hidden" name="locale" value={locale} />
              <button className={buttonClass("secondary", "md", "w-full")}>{t.auth.logout}</button>
            </form>
          )}
        </div>
      )}
      {state.status === "sent" ? <Sent /> : demo ? (
        <Notice>{t.auth.demoBody}</Notice>
      ) : (
        <form action={action} className="grid gap-4">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="mode" value={mode} />
          {next && <input type="hidden" name="next" value={next} />}
          <Field label={t.auth.email}><input name="email" type="email" required autoComplete="email" defaultValue={state.email} className={inputClass} /></Field>
          {mode === "password" && (
            <Field label={t.auth.password}><input name="password" type="password" required autoComplete="current-password" className={inputClass} /></Field>
          )}
          {state.status === "error" && <p role="alert" className="text-[13px] text-danger">{authMessage(t.auth, state.message)}</p>}
          <button disabled={pending} className={buttonClass("primary", "lg", "w-full")}>
            {pending ? t.common.loading : mode === "password" ? t.auth.submitLogin : t.auth.magicLink}
          </button>
          {state.message === "unconfirmed" && (
            <button name="intent" value="resend" formNoValidate disabled={pending} className={buttonClass("secondary", "md", "w-full")}>
              {t.auth.resendConfirmation}
            </button>
          )}
          <div className="flex items-center justify-between text-[13px]">
            <button type="button" onClick={() => setMode(mode === "password" ? "magic" : "password")} className="text-accent hover:underline">
              {mode === "password" ? t.auth.magicLink : t.auth.password}
            </button>
            <Link href={`/${locale}/forgot`} className="text-muted hover:text-fg">{t.auth.forgot}</Link>
          </div>
          <Providers />
        </form>
      )}
      {demo && <DemoAccess />}
      <p className="mt-6 text-center text-[13px] text-muted">
        {t.auth.noAccount} <Link href={`/${locale}/register`} className="font-medium text-fg hover:underline">{t.nav.becomePartner}</Link>
      </p>
    </Shell>
  );
}

export function RegisterForm({ demo, sponsorCode, sponsorName }: { demo: boolean; sponsorCode?: string | null; sponsorName?: string | null }) {
  const { t, locale } = useI18n();
  const [state, action, pending] = useActionState<AuthState, FormData>(signUp, { status: "idle" });
  return (
    <Shell title={t.auth.registerTitle} subtitle={t.auth.registerSubtitle}>
      {state.status === "sent" ? <Sent /> : demo ? <Notice>{t.auth.demoBody}</Notice> : (
        <form action={action} className="grid gap-4">
          <input type="hidden" name="locale" value={locale} />
          {sponsorCode && <input type="hidden" name="sponsorCode" value={sponsorCode} />}
          {sponsorCode && <Notice>{sponsorName ? t.auth.sponsorInvite.replace("{name}", sponsorName) : t.auth.sponsorInviteGeneric}</Notice>}
          <Field label={t.auth.fullName}><input name="fullName" required autoComplete="name" className={inputClass} /></Field>
          <Field label={t.auth.email}><input name="email" type="email" required autoComplete="email" className={inputClass} /></Field>
          <Field label={t.auth.password} hint="10+"><input name="password" type="password" required minLength={10} autoComplete="new-password" className={inputClass} /></Field>
          <Field label={t.auth.country}><input name="country" maxLength={2} placeholder="FR" autoComplete="country" className={inputClass} /></Field>
          <Field label={t.auth.channels}><input name="channels" className={inputClass} /></Field>
          <label className="flex items-start gap-3 text-[13px] text-fg-2">
            <input type="checkbox" name="terms" required className="mt-0.5 size-4 accent-[var(--accent)]" />
            <span>
              <Link href={`/${locale}/affiliate-terms`} className="underline underline-offset-2">{t.auth.acceptTerms}</Link>
            </span>
          </label>
          {state.status === "error" && <p className="text-[13px] text-danger">{state.message}</p>}
          <button disabled={pending} className={buttonClass("accent", "lg", "w-full")}>{pending ? t.common.loading : t.auth.submitRegister}</button>
          <Providers />
        </form>
      )}
      {demo && <DemoAccess />}
      <p className="mt-6 text-center text-[13px] text-muted">
        {t.auth.haveAccount} <Link href={`/${locale}/login`} className="font-medium text-fg hover:underline">{t.nav.login}</Link>
      </p>
    </Shell>
  );
}

export function ForgotForm({ demo }: { demo: boolean }) {
  const { t, locale } = useI18n();
  const [state, action, pending] = useActionState<AuthState, FormData>(forgotPassword, { status: "idle" });
  return (
    <Shell title={t.auth.forgotTitle} subtitle={t.auth.forgotSubtitle}>
      {state.status === "sent" ? <Sent /> : demo ? <Notice>{t.auth.demoBody}</Notice> : (
        <form action={action} className="grid gap-4">
          <input type="hidden" name="locale" value={locale} />
          <Field label={t.auth.email}><input name="email" type="email" required autoComplete="email" className={inputClass} /></Field>
          <button disabled={pending} className={buttonClass("primary", "lg", "w-full")}>{pending ? t.common.loading : t.auth.submitForgot}</button>
        </form>
      )}
      <p className="mt-6 text-center text-[13px]"><Link href={`/${locale}/login`} className="text-muted hover:text-fg">{t.common.back}</Link></p>
    </Shell>
  );
}

export function ResetForm({ demo, hasSession }: { demo: boolean; hasSession: boolean }) {
  const { t, locale } = useI18n();
  const [state, action, pending] = useActionState<AuthState, FormData>(updatePassword, { status: "idle" });
  const expired = !demo && (!hasSession || state.message === "linkExpired");
  return (
    <Shell title={t.auth.resetTitle} subtitle={t.auth.resetSubtitle}>
      {demo ? <Notice>{t.auth.demoBody}</Notice> : expired ? (
        <div className="grid gap-4">
          <Notice tone="warning">{t.auth.linkExpired}</Notice>
          <Link href={`/${locale}/forgot`} className={buttonClass("primary", "lg", "w-full")}>{t.auth.requestNewLink}</Link>
        </div>
      ) : (
        <form action={action} className="grid gap-4">
          <input type="hidden" name="locale" value={locale} />
          <Field label={t.auth.newPassword} hint="10+"><input name="password" type="password" required minLength={10} maxLength={200} autoComplete="new-password" className={inputClass} /></Field>
          <Field label={t.auth.confirmPassword}><input name="confirm" type="password" required minLength={10} maxLength={200} autoComplete="new-password" className={inputClass} /></Field>
          {state.status === "error" && <p role="alert" className="text-[13px] text-danger">{authMessage(t.auth, state.message)}</p>}
          <button disabled={pending} className={buttonClass("primary", "lg", "w-full")}>{pending ? t.common.loading : t.auth.submitReset}</button>
        </form>
      )}
      <p className="mt-6 text-center text-[13px]"><Link href={`/${locale}/login`} className="text-muted hover:text-fg">{t.common.back}</Link></p>
    </Shell>
  );
}
