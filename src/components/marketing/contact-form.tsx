"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { useActionState } from "react";
import { submitLead, type LeadState } from "@/app/actions/lead";
import { useI18n } from "@/components/providers";
import { buttonClass } from "@/components/ui/button";
import { Field, inputClass, textareaClass } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

export function ContactForm({ source }: { source: "home" | "contact" }) {
  const { t, locale } = useI18n();
  const [state, action, pending] = useActionState<LeadState, FormData>(submitLead, { status: "idle" });
  const copy = t.contactForm;
  const invalid = (name: string) => state.fields?.includes(name);

  if (state.status === "success") {
    return <div className="flex min-h-80 flex-col items-center justify-center gap-4 text-center"><CheckCircle2 className="size-12 text-success" /><p className="max-w-sm text-[17px] font-medium text-fg">{copy.success}</p></div>;
  }

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="source" value={source} />
      <input type="hidden" name="requestType" value="question" />
      <div aria-hidden className="absolute -start-[9999px] h-0 overflow-hidden"><label>Website URL<input name="company_url" tabIndex={-1} autoComplete="off" /></label></div>
      <Field label={copy.firstName}><input name="firstName" required autoComplete="given-name" className={cn(inputClass, invalid("firstName") && "border-danger")} /></Field>
      <Field label={copy.lastName}><input name="lastName" required autoComplete="family-name" className={cn(inputClass, invalid("lastName") && "border-danger")} /></Field>
      <Field label={copy.email}><input name="email" required type="email" autoComplete="email" className={cn(inputClass, invalid("email") && "border-danger")} /></Field>
      <Field label={copy.phone}><input name="phone" required type="tel" autoComplete="tel" className={cn(inputClass, invalid("phone") && "border-danger")} /></Field>
      <Field label={copy.company} className="sm:col-span-2"><input name="company" autoComplete="organization" className={inputClass} /></Field>
      <Field label={copy.message} className="sm:col-span-2"><textarea name="message" required rows={5} className={cn(textareaClass, invalid("message") && "border-danger")} /></Field>
      <label className="flex items-start gap-3 text-[13px] leading-relaxed text-fg-2 sm:col-span-2">
        <input type="checkbox" name="consent" required className="mt-1 size-4 accent-[var(--accent)]" />
        <span>{copy.consent} <Link href={`/${locale}/privacy`} className="underline underline-offset-2">{t.footer.privacy}</Link></span>
      </label>
      {state.status === "error" && <p role="alert" className="text-[13px] text-danger sm:col-span-2">{copy.error}</p>}
      <button type="submit" disabled={pending} className={buttonClass("accent", "lg", "sm:col-span-2")}>{pending ? copy.sending : copy.submit}</button>
    </form>
  );
}
