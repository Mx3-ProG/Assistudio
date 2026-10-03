"use client";

import { CheckCircle2 } from "lucide-react";
import { useActionState } from "react";
import { subscribeNewsletter, type NewsletterState } from "@/app/actions/newsletter";
import { useI18n } from "@/components/providers";
import { buttonClass } from "@/components/ui/button";
import { inputClass } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

export function NewsletterForm({ source }: { source: "home" | "contact" }) {
  const { t, locale } = useI18n();
  const [state, action, pending] = useActionState<NewsletterState, FormData>(subscribeNewsletter, { status: "idle" });
  const copy = t.newsletter;

  if (state.status === "success") return <p className="flex items-center gap-2 font-medium text-white"><CheckCircle2 className="size-5 text-blue-300" />{copy.success}</p>;

  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="source" value={source} />
      <div aria-hidden className="absolute -start-[9999px] h-0 overflow-hidden"><label>Website URL<input name="website_url" tabIndex={-1} autoComplete="off" /></label></div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor={`newsletter-${source}`}>{copy.email}</label>
        <input id={`newsletter-${source}`} name="email" type="email" required autoComplete="email" placeholder={copy.email} className={cn(inputClass, "h-12 border-white/20 bg-white text-[#071020] placeholder:text-[#536071] focus:border-blue-300 sm:flex-1")} />
        <button type="submit" disabled={pending} className={buttonClass("inverse", "lg", "shrink-0")}>{pending ? copy.sending : copy.submit}</button>
      </div>
      <label className="flex items-start gap-2 text-[12px] leading-relaxed text-white/75"><input type="checkbox" name="consent" required className="mt-0.5 size-4 accent-blue-400" /><span>{copy.consent}</span></label>
      {state.status === "error" && <p role="alert" className="text-[13px] text-red-200">{copy.error}</p>}
    </form>
  );
}
