"use client";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { MailCheck } from "lucide-react";
import { codeAuth, demoSignIn, signInWithProvider, signOut, type AuthState } from "@/app/actions/auth";
import { useI18n } from "@/components/providers";
import { Field, inputClass, Notice } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { CODE_LENGTH, RESEND_AFTER_SECONDS } from "@/lib/auth-code-rules";

function Shell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="w-full max-w-[420px] animate-rise">
      <h1 className="text-[32px] font-semibold tracking-[-0.035em]">{title}</h1>
      <p className="mt-2 text-[15px] text-muted">{subtitle}</p>
      <div className="card mt-8 p-6 shadow-soft sm:p-7">{children}</div>
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

/** Shown above the login form: a session without a usable account, or a failed OAuth callback. */
export type AuthNotice = "accountUnavailable" | "linkExpired";

function ErrorText({ state }: { state: AuthState }) {
  const { t } = useI18n();
  if (!state.error) return null;
  return (
    <div role="alert" className="grid gap-1">
      <p className="text-[13px] text-danger">{t.auth.errors[state.error]}</p>
      {state.detail && <p className="break-words font-mono text-[11.5px] text-muted">{t.auth.technicalDetail} {state.detail}</p>}
    </div>
  );
}

function Hidden({ values }: { values: Record<string, string | undefined> }) {
  return Object.entries(values).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null));
}

/** Seconds left before a new code may be requested. */
function useCountdown(sentAt?: number) {
  const [left, setLeft] = useState(RESEND_AFTER_SECONDS);
  useEffect(() => {
    const tick = () => setLeft(sentAt ? Math.max(0, Math.ceil((sentAt + RESEND_AFTER_SECONDS * 1000 - Date.now()) / 1000)) : 0);
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [sentAt]);
  return left;
}

/** Step 2 — type the 6-digit code received by email. */
function CodeStep({ state, action, pending, next }: { state: AuthState; action: (f: FormData) => void; pending: boolean; next?: string }) {
  const { t, locale } = useI18n();
  const left = useCountdown(state.sentAt);
  const verifyRef = useRef<HTMLButtonElement>(null);
  const signup = state.purpose === "signup";
  const application = Object.fromEntries(Object.entries(state.values ?? {}).filter(([k]) => k !== "email"));
  return (
    <form action={action} className="grid gap-4">
      <Hidden values={{ locale, purpose: state.purpose, email: state.email, next, ...(signup ? application : {}) }} />
      <div className="flex flex-col items-center gap-2 pb-1 text-center">
        <MailCheck className="size-9 text-success" />
        <p className="text-[16px] font-semibold">{t.auth.codeSentTitle}</p>
        <p className="text-[13.5px] text-fg-2">{(signup ? t.auth.codeSentToSignup : t.auth.codeSentTo).replace("{email}", state.email ?? "")}</p>
      </div>
      {state.demoCode && (
        <Notice tone="warning">
          {t.auth.demoCode} <strong className="font-mono text-[15px] tracking-[0.2em] text-fg">{state.demoCode}</strong>
        </Notice>
      )}
      <Field label={t.auth.codeLabel}>
        <input
          name="code" required autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={CODE_LENGTH + 2}
          placeholder="000000" aria-invalid={!!state.error}
          className={cn(inputClass, "h-14 text-center font-mono text-[24px] tracking-[0.4em]")}
          onInput={(e) => {
            const digits = e.currentTarget.value.replace(/\D/g, "");
            if (digits.length === CODE_LENGTH && !pending) e.currentTarget.form?.requestSubmit(verifyRef.current);
          }}
        />
      </Field>
      <ErrorText state={state} />
      <button ref={verifyRef} name="intent" value="verify" disabled={pending} className={buttonClass("primary", "lg", "w-full")}>
        {pending ? t.common.loading : signup ? t.auth.verify : t.auth.submitLogin}
      </button>
      <div className="flex items-center justify-between gap-3 text-[13px]">
        <button name="intent" value="send" formNoValidate disabled={pending || left > 0} className="text-accent hover:underline disabled:text-muted disabled:no-underline">
          {left > 0 ? t.auth.resendIn.replace("{s}", String(left)) : t.auth.resend}
        </button>
        <button name="intent" value="edit" formNoValidate disabled={pending} className="text-muted hover:text-fg">{t.auth.changeEmail}</button>
      </div>
      {!signup && <p className="text-[12.5px] text-muted">{t.auth.noCodeHint}</p>}
    </form>
  );
}

const invalid = (state: AuthState, field: string) => state.status === "error" && !!state.fields?.includes(field);

export function LoginForm({ demo, next, notice }: { demo: boolean; next?: string; notice?: AuthNotice }) {
  const { t, locale } = useI18n();
  const [state, action, pending] = useActionState<AuthState, FormData>(codeAuth, { status: "idle" });
  const v = state.values ?? {};
  return (
    <Shell title={t.auth.loginTitle} subtitle={t.auth.loginSubtitle}>
      {notice && state.status === "idle" && (
        <div className="mb-4 grid gap-3">
          <Notice tone="warning">{t.auth[notice]}</Notice>
          {notice === "accountUnavailable" && (
            <form action={signOut}>
              <input type="hidden" name="locale" value={locale} />
              <button className={buttonClass("secondary", "md", "w-full")}>{t.auth.logout}</button>
            </form>
          )}
        </div>
      )}
      {state.status === "code" ? <CodeStep state={state} action={action} pending={pending} next={next} /> : (
        <form key={JSON.stringify(v)} action={action} className="grid gap-4">
          <Hidden values={{ locale, purpose: "login", next }} />
          <Field label={t.auth.email} hint={t.auth.noPassword}>
            <input name="email" type="email" required autoFocus autoComplete="email" defaultValue={v.email} className={inputClass} />
          </Field>
          <ErrorText state={state} />
          <button name="intent" value="send" disabled={pending} className={buttonClass("primary", "lg", "w-full")}>
            {pending ? t.common.loading : t.auth.sendCode}
          </button>
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
  const [state, action, pending] = useActionState<AuthState, FormData>(codeAuth, { status: "idle" });
  const v = state.values ?? {};
  return (
    <Shell title={t.auth.registerTitle} subtitle={t.auth.registerSubtitle}>
      {state.status === "code" ? <CodeStep state={state} action={action} pending={pending} /> : (
        <form key={JSON.stringify(v)} action={action} className="grid gap-4">
          <Hidden values={{ locale, purpose: "signup", sponsorCode: sponsorCode ?? undefined }} />
          {sponsorCode && <Notice>{sponsorName ? t.auth.sponsorInvite.replace("{name}", sponsorName) : t.auth.sponsorInviteGeneric}</Notice>}
          <Field label={t.auth.fullName}>
            <input name="fullName" required minLength={2} autoComplete="name" defaultValue={v.fullName} aria-invalid={invalid(state, "fullName")} className={inputClass} />
          </Field>
          <Field label={t.auth.email} hint={t.auth.noPassword}>
            <input name="email" type="email" required autoComplete="email" defaultValue={v.email} aria-invalid={state.error === "invalidEmail"} className={inputClass} />
          </Field>
          <Field label={t.auth.country}>
            <input name="country" maxLength={2} placeholder="FR" autoComplete="country" defaultValue={v.country} aria-invalid={invalid(state, "country")} className={inputClass} />
          </Field>
          <Field label={t.auth.channels}><input name="channels" defaultValue={v.channels} className={inputClass} /></Field>
          <label className="flex items-start gap-3 text-[13px] text-fg-2">
            <input type="checkbox" name="terms" required defaultChecked={v.terms === "on"} className="mt-0.5 size-4 accent-[var(--accent)]" />
            <span>
              {t.auth.acceptTerms}
              <span className="mt-1 block text-muted">
                {t.common.learnMore} :{" "}
                <Link href={`/${locale}/affiliate-terms`} className="underline underline-offset-2">{t.footer.affiliateTerms}</Link>
                {" · "}
                <Link href={`/${locale}/privacy`} className="underline underline-offset-2">{t.footer.privacy}</Link>
              </span>
            </span>
          </label>
          <ErrorText state={state} />
          <button name="intent" value="send" disabled={pending} className={buttonClass("accent", "lg", "w-full")}>{pending ? t.common.loading : t.auth.submitRegister}</button>
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
