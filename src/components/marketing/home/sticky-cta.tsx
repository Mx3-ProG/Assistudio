"use client";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useI18n } from "@/components/providers";
import { useStored } from "@/lib/hooks/use-stored";
import { cn } from "@/lib/cn";
import { TrackedLink } from "./tracked-link";

/**
 * Mobile-only bottom bar. Appears once the visitor has scrolled past the hero,
 * hides while another sign-up CTA (`[data-cta]`) or the footer is on screen,
 * and while the cookie banner is still waiting for an answer — so it never
 * sits on top of the end of the page or of another call to action.
 */
export function StickyCta({ href }: { href: string }) {
  const { t } = useI18n();
  const [consent] = useStored("studio-consent", null);
  const [scrolled, setScrolled] = useState(false);
  const [ctaVisible, setCtaVisible] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 560);
    on();
    window.addEventListener("scroll", on, { passive: true });
    const seen = new Set<Element>();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) seen.add(e.target);
        else seen.delete(e.target);
      }
      setCtaVisible(seen.size > 0);
    });
    document.querySelectorAll("[data-cta], footer").forEach((el) => io.observe(el));
    return () => { window.removeEventListener("scroll", on); io.disconnect(); };
  }, []);

  const show = scrolled && !ctaVisible && !!consent;
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/85 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl transition-transform duration-300 sm:hidden",
        show ? "translate-y-0" : "pointer-events-none translate-y-full",
      )}
      aria-hidden={!show}
      inert={!show}
    >
      <TrackedLink href={href} event="hero_signup_click" placement="sticky_mobile" size="md" className="h-12 w-full text-[15px]">
        {t.hc.sticky.cta} <ArrowRight className="flip-rtl size-4" />
      </TrackedLink>
    </div>
  );
}
