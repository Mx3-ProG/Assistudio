"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CircleCheck, Loader2, Clock, CircleHelp } from "lucide-react";

type Status = "processing" | "confirmed" | "expired" | "unknown";
const POLL_MS = 2000;
const SLOW_AFTER_MS = 45_000;

/** Polls the read-only status endpoint until the webhook has recorded the payment. */
export function PaymentStatus({ sessionId, locale, text }: {
  sessionId: string;
  locale: string;
  text: { confirmingTitle: string; confirmingBody: string; welcomeTitle: string; welcomeBody: string; slowTitle: string; slowBody: string; unknownTitle: string; unknownBody: string; back: string };
}) {
  const [status, setStatus] = useState<Status>(sessionId ? "processing" : "unknown");
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    let stop = false;
    const started = Date.now();
    const tick = async () => {
      try {
        const res = await fetch(`/api/checkout/status?session_id=${encodeURIComponent(sessionId)}`, { cache: "no-store" });
        const { status: s } = (await res.json()) as { status: Status };
        if (stop) return;
        // "unknown" right after redirect can simply mean the row is not visible yet.
        if (s === "confirmed" || s === "expired" || (s === "unknown" && Date.now() - started > 10_000)) { setStatus(s); return; }
      } catch { /* network hiccup: keep polling */ }
      if (Date.now() - started > SLOW_AFTER_MS) setSlow(true);
      if (!stop) setTimeout(tick, Date.now() - started > SLOW_AFTER_MS ? POLL_MS * 5 : POLL_MS);
    };
    tick();
    return () => { stop = true; };
  }, [sessionId]);

  const view =
    status === "confirmed" ? { Icon: CircleCheck, tone: "text-success", title: text.welcomeTitle, body: text.welcomeBody }
    : status === "processing" && !slow ? { Icon: Loader2, tone: "text-accent animate-spin", title: text.confirmingTitle, body: text.confirmingBody }
    : status === "processing" ? { Icon: Clock, tone: "text-warning", title: text.slowTitle, body: text.slowBody }
    : { Icon: CircleHelp, tone: "text-muted", title: text.unknownTitle, body: text.unknownBody };

  return (
    <div aria-live="polite">
      <view.Icon className={`mx-auto size-12 ${view.tone}`} aria-hidden />
      <h1 className="display mt-6 text-[34px] sm:text-[48px]">{view.title}</h1>
      <p className="mx-auto mt-4 max-w-md text-[16px] leading-relaxed text-fg-2">{view.body}</p>
      <Link href={`/${locale}/studio`} className="mt-10 inline-flex h-11 items-center rounded-full border border-line bg-surface-2 px-6 text-[14px] font-medium hover:bg-surface-3">{text.back}</Link>
    </div>
  );
}
