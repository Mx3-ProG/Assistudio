"use client";
import Link from "next/link";
import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { submitLead, type LeadState } from "@/app/actions/lead";
import { useI18n } from "@/components/providers";
import { Field, inputClass, textareaClass } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { trackOnce } from "@/lib/analytics/client";

export function LeadForm({ page, referral, cta, requestType, advisorName }: { page?: string; referral?: string; cta?: string; requestType?: "info" | "call" | "question" | "quote"; advisorName?: string | null }) {
  const { t, locale } = useI18n();
  const [state, action, pending] = useActionState<LeadState, FormData>(submitLead, { status: "idle" });
  const f = t.studio.form;
  const bad = (k: string) => state.fields?.includes(k);

  if (state.status === "success") {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <CheckCircle2 className="size-12 text-success" />
        <p className="max-w-sm text-[17px] font-medium">{f.success}</p>
      </div>
    );
  }

  return (
    <form action={action} onFocusCapture={() => trackOnce("studio-lead-form", "studio_form_started", { placement: "lead_form" })} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="locale" value={locale} />
      {page && <input type="hidden" name="page" value={page} />}
      {referral && <input type="hidden" name="referral" value={referral} />}
      {requestType && <input type="hidden" name="requestType" value={requestType} />}
      <div aria-hidden className="absolute -start-[9999px] h-0 overflow-hidden">
        <label>Website URL<input name="company_url" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <Field label={f.fullName}>
        <input name="fullName" required autoComplete="name" className={cn(inputClass, bad("fullName") && "border-danger")} />
      </Field>
      <Field label={f.email}>
        <input name="email" type="email" required autoComplete="email" className={cn(inputClass, bad("email") && "border-danger")} />
      </Field>
      <Field label={f.company}>
        <input name="company" autoComplete="organization" className={inputClass} />
      </Field>
      <Field label={f.profession}>
        <input name="profession" className={inputClass} />
      </Field>
      <Field label={f.phone}>
        <input name="phone" type="tel" autoComplete="tel" className={inputClass} />
      </Field>
      <Field label={f.website}>
        <input name="website" type="url" inputMode="url" placeholder="https://" className={inputClass} />
      </Field>
      <Field label={f.message} className="sm:col-span-2">
        <textarea name="message" rows={4} className={textareaClass} />
      </Field>
      <label className="flex items-start gap-3 text-[13px] leading-relaxed text-fg-2 sm:col-span-2">
        <input type="checkbox" name="consent" required className="mt-1 size-4 accent-[var(--accent)]" />
        <span>
          {f.consent}{" "}
          <Link href={`/${locale}/privacy`} className="underline underline-offset-2">{t.footer.privacy}</Link>
        </span>
      </label>
      {advisorName && (
        <label className="flex items-start gap-3 text-[13px] leading-relaxed text-fg-2 sm:col-span-2">
          <input type="checkbox" name="advisorConsent" className="mt-1 size-4 accent-[var(--accent)]" />
          <span>{t.sc.landing.advisorConsent.replace("{name}", advisorName)}</span>
        </label>
      )}
      {state.status === "error" && <p className="text-[13px] text-danger sm:col-span-2">{f.error}</p>}
      <button type="submit" disabled={pending} className={buttonClass("accent", "lg", "sm:col-span-2")}>
        {pending ? t.common.loading : cta ?? f.submit}
      </button>
    </form>
  );
}
