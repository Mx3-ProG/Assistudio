"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { AlertCircle, LoaderCircle } from "lucide-react";
import { createEmbeddedCheckout } from "@/app/actions/checkout";

interface EmbeddedCheckoutInput {
  locale: string;
  origin: "public" | "affiliate_link" | "private_page" | "dashboard_cta";
  page: string | null;
  referral: string | null;
  offer: "one" | "pro" | "premium";
  billing: "annual" | "monthly";
  promo: string | null;
}

export function EmbeddedCheckoutPanel({ publishableKey, input, loadingLabel, retryLabel, errorLabel }: {
  publishableKey: string;
  input: EmbeddedCheckoutInput;
  loadingLabel: string;
  retryLabel: string;
  errorLabel: string;
}) {
  const router = useRouter();
  const sessionId = useRef<string | null>(null);
  const [error, setError] = useState(false);
  const stripe = useMemo(() => loadStripe(publishableKey), [publishableKey]);
  const fetchClientSecret = useCallback(async () => {
    try {
      const result = await createEmbeddedCheckout(input);
      sessionId.current = result.sessionId;
      return result.clientSecret;
    } catch (cause) {
      console.error("Embedded Checkout initialization failed", cause);
      setError(true);
      throw cause;
    }
  }, [input]);
  const options = useMemo(() => ({
    fetchClientSecret,
    onComplete: () => {
      if (sessionId.current) router.replace(`/${input.locale}/success?session_id=${encodeURIComponent(sessionId.current)}`);
    },
  }), [fetchClientSecret, input.locale, router]);

  if (error) {
    return <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-danger/20 bg-danger-soft p-8 text-center">
      <AlertCircle className="size-7 text-danger" />
      <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-fg-2">{errorLabel}</p>
      <button type="button" onClick={() => window.location.reload()} className="mt-5 rounded-full bg-fg px-5 py-2.5 text-[13px] font-medium text-bg">
        {retryLabel}
      </button>
    </div>;
  }

  return <div className="relative min-h-[560px] overflow-hidden rounded-[28px] border border-line bg-white shadow-lift">
    <div className="pointer-events-none absolute inset-x-0 top-0 z-0 flex h-64 items-center justify-center text-slate-500">
      <LoaderCircle className="me-2 size-4 animate-spin" />
      <span className="text-[13px]">{loadingLabel}</span>
    </div>
    <div className="relative z-10 bg-white">
      <EmbeddedCheckoutProvider stripe={stripe} options={options}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  </div>;
}
