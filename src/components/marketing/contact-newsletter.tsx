import { Mail, Sparkles } from "lucide-react";
import type { Dictionary } from "@/i18n/types";
import { ContactForm } from "./contact-form";
import { NewsletterForm } from "./newsletter-form";

export function ContactNewsletter({ t, source }: { t: Dictionary; source: "home" | "contact" }) {
  return (
    <section id="contact" className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="grid overflow-hidden rounded-[32px] border border-line bg-surface shadow-lift lg:grid-cols-[0.82fr_1.18fr]">
          <div className="relative overflow-hidden bg-[#071020] p-7 text-white sm:p-10 lg:p-12">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_80%_at_0%_100%,rgb(47_91_255_/_0.35),transparent)]" />
            <div className="relative"><Mail className="size-7 text-blue-300" /><p className="mt-8 text-[12px] font-semibold uppercase tracking-[0.16em] text-blue-300">{t.contactForm.eyebrow}</p><h2 className="display mt-4 text-[40px] leading-[0.98] text-white sm:text-[56px]">{t.contactForm.title}</h2><p className="mt-6 max-w-md text-[16px] leading-relaxed text-white/70">{t.contactForm.body}</p></div>
          </div>
          <div className="theme-light-surface bg-white p-6 text-[#071020] sm:p-10 lg:p-12"><ContactForm source={source} /></div>
        </div>

        <div className="relative mt-8 overflow-hidden rounded-[28px] bg-[#0b1628] px-6 py-8 text-white sm:px-10 sm:py-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_120%_at_100%_0%,rgb(47_91_255_/_0.38),transparent)]" />
          <div className="relative grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div><p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-blue-300"><Sparkles className="size-4" />{t.newsletter.eyebrow}</p><h2 className="display mt-3 text-[34px] text-white sm:text-[44px]">{t.newsletter.title}</h2><p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/70">{t.newsletter.body}</p></div>
            <NewsletterForm source={source} />
          </div>
        </div>
      </div>
    </section>
  );
}
