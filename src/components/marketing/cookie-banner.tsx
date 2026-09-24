"use client";
import Link from "next/link";
import { useI18n } from "@/components/providers";
import { buttonClass } from "@/components/ui/button";
import { useStored, useIsClient } from "@/lib/hooks/use-stored";

/**
 * Consent banner. Only strictly-necessary cookies (session, locale, referral
 * attribution) are set without consent; no optional analytics is loaded
 * unless `studio-consent=analytics`. Final wording pending legal validation.
 */
export function CookieBanner() {
  const { t, locale } = useI18n();
  const [consent, setConsent] = useStored("studio-consent", null);
  const isClient = useIsClient(); // never render during SSR → no flash for returning visitors

  const decide = (v: "necessary" | "analytics") => {
    document.cookie = `studio-consent=${v};path=/;max-age=${60 * 60 * 24 * 180};samesite=lax`;
    setConsent(v);
  };

  if (consent || !isClient) return null;
  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl sm:bottom-5">
      <div className="glass flex flex-col gap-4 rounded-2xl p-4 shadow-lift sm:flex-row sm:items-center sm:p-5">
        <p className="min-w-0 flex-1 text-[13px] leading-relaxed text-fg-2">
          {t.cookieBanner.text}{" "}
          <Link href={`/${locale}/cookies`} className="underline underline-offset-2">{t.cookieBanner.policy}</Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <button type="button" className={buttonClass("secondary", "sm")} onClick={() => decide("necessary")}>{t.cookieBanner.decline}</button>
          <button type="button" className={buttonClass("primary", "sm")} onClick={() => decide("analytics")}>{t.cookieBanner.accept}</button>
        </div>
      </div>
    </div>
  );
}
