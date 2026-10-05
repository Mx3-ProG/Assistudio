"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight, ChevronDown, Compass, FileText, MessageCircleQuestion, PlayCircle, Search, Sparkles, X } from "lucide-react";
import { useI18n } from "@/components/providers";
import { fmt } from "@/i18n/format";
import { HELP_ARTICLES, HELP_VIDEOS, ESSENTIALS, pick, type HelpArticle } from "@/content/help-videos";
import { TOUR_STEPS, topicFor, type HelpTopic } from "@/lib/help/tour";
import { RedCount } from "@/components/ui/badge-icon";
import { cn } from "@/lib/cn";
import { useHelp } from "./help-context";

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");

/**
 * The "? Help" panel: understands the current page (contextual questions first),
 * searches every tutorial and answer, relaunches the tour, and leads to the
 * existing help-request form. A side sheet on desktop, a bottom sheet on phones.
 */
export function HelpCenter() {
  const { t, locale } = useI18n();
  const H = t.hp.center;
  const { centerOpen, closeCenter, state, startTour, helpUnread } = useHelp();
  const pathname = usePathname();
  const [q, setQ] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const base = `/${locale}/dashboard`;
  const topic: HelpTopic = topicFor(pathname);
  const contextual = HELP_ARTICLES[topic];

  useEffect(() => {
    if (!centerOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeCenter(); };
    window.addEventListener("keydown", onKey);
    // Phones: don't pop the keyboard over the panel.
    if (window.matchMedia("(min-width: 640px)").matches) input.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [centerOpen, closeCenter]);

  const results = useMemo(() => {
    const needle = norm(q.trim());
    if (needle.length < 2) return null;
    const videos = HELP_VIDEOS.filter((v) => norm(`${pick(v.title, locale)} ${pick(v.description, locale)}`).includes(needle));
    const seen = new Set<string>();
    const articles: HelpArticle[] = [];
    for (const list of Object.values(HELP_ARTICLES)) for (const a of list) {
      const key = a.q.en;
      if (!seen.has(key) && norm(`${pick(a.q, locale)} ${pick(a.a, locale)}`).includes(needle)) { seen.add(key); articles.push(a); }
    }
    return { videos, articles };
  }, [q, locale]);

  if (!centerOpen) return null;

  const tour = state.tour;
  const tourAction = tour.status === "paused" && tour.step > 0
    ? { label: fmt(H.tourResume, { n: tour.step + 1, total: TOUR_STEPS.length }), step: tour.step }
    : { label: tour.status === "idle" ? H.tourStart : H.tourRestart, step: 0 };
  const video = (slug?: string) => (slug ? HELP_VIDEOS.find((v) => v.slug === slug) : undefined);

  const article = (a: HelpArticle) => {
    const v = video(a.video);
    return (
      <details key={a.q.en} className="group rounded-2xl border border-line bg-surface open:bg-surface-2/50">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 text-[14px] font-medium [&::-webkit-details-marker]:hidden">
          <span className="flex-1">{pick(a.q, locale)}</span>
          <ChevronDown className="size-4 shrink-0 text-muted transition group-open:rotate-180" />
        </summary>
        <div className="px-4 pb-4">
          <p className="text-[13.5px] leading-relaxed text-fg-2">{pick(a.a, locale)}</p>
          {v && (
            <Link href={`${base}/documents/videos/${v.slug}`} className="mt-2.5 inline-flex items-center gap-1.5 text-[13px] font-medium text-accent hover:underline">
              <PlayCircle className="size-4" />{v.src ? H.watch : H.read} · {pick(v.title, locale)}
            </Link>
          )}
        </div>
      </details>
    );
  };

  const row = (href: string | null, icon: React.ReactNode, title: string, hint?: string, onClick?: () => void, extra?: React.ReactNode) => {
    const inner = (
      <>
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14.5px] font-medium">{title}</span>
          {hint && <span className="block text-[12.5px] text-muted">{hint}</span>}
        </span>
        {extra}
        <ArrowRight className="flip-rtl size-4 shrink-0 text-muted" />
      </>
    );
    const cls = "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-start transition hover:bg-surface-2";
    return href ? <Link href={href} className={cls}>{inner}</Link> : <button type="button" onClick={onClick} className={cls}>{inner}</button>;
  };

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-labelledby="help-center-title">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={closeCenter} />
      <aside className={cn(
        "absolute flex flex-col overflow-hidden bg-bg-elevated shadow-lift",
        "inset-x-0 bottom-0 max-h-[88dvh] rounded-t-[28px] pb-[env(safe-area-inset-bottom)]",
        "sm:inset-y-3 sm:end-3 sm:start-auto sm:bottom-3 sm:max-h-none sm:w-[400px] sm:rounded-[28px] sm:border sm:border-line",
      )}>
        <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h2 id="help-center-title" className="text-[18px] font-semibold tracking-tight">{H.title}</h2>
          <button type="button" onClick={closeCenter} aria-label={H.close} className="grid size-9 place-items-center rounded-full bg-surface-2"><X className="size-4" /></button>
        </header>
        <div className="no-scrollbar flex-1 overflow-y-auto px-4 py-4">
          <label className="relative block">
            <span className="sr-only">{H.search}</span>
            <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder={H.search} type="search"
              className="h-11 w-full rounded-full border border-line bg-surface ps-10 pe-4 text-[14.5px] outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/15" />
          </label>

          {results ? (
            <div className="mt-4 grid gap-2">
              {results.videos.map((v) => <div key={v.slug}>{row(`${base}/documents/videos/${v.slug}`, <PlayCircle className="size-[18px]" />, pick(v.title, locale), pick(v.description, locale))}</div>)}
              {results.articles.map(article)}
              {!results.videos.length && !results.articles.length && <p className="px-2 py-6 text-center text-[14px] text-muted">{H.noResults}</p>}
            </div>
          ) : (
            <>
              {contextual.length > 0 && (
                <section className="mt-5">
                  <h3 className="px-1 text-[13px] font-semibold text-fg-2">{fmt(H.contextTitle, { page: t.hp.pages[topic] })}</h3>
                  <div className="mt-2.5 grid gap-2">{contextual.map(article)}</div>
                </section>
              )}
              <section className="mt-5 grid gap-0.5">
                {row(null, <Compass className="size-[18px]" />, tourAction.label, H.tour, () => startTour(tourAction.step))}
                {row(`${base}/documents/videos`, <PlayCircle className="size-[18px]" />, H.videos, H.videosHint)}
                {row(`${base}/documents/videos#essentials`, <Sparkles className="size-[18px]" />, H.newHere, ESSENTIALS.map((v) => pick(v.title, locale)).join(" · "))}
                {row(`${base}/documents`, <FileText className="size-[18px]" />, H.documents, H.documentsHint)}
              </section>
            </>
          )}

          <section className="mt-5 rounded-[22px] bg-surface-2/70 p-4">
            <h3 className="text-[14.5px] font-semibold">{H.contact}</h3>
            <p className="mt-1 text-[13px] leading-relaxed text-muted">{H.contactBody}</p>
            <div className="mt-3 grid gap-0.5">
              {row(`${base}/help?from=${encodeURIComponent(pathname)}`, <MessageCircleQuestion className="size-[18px]" />, H.contactCta)}
              {helpUnread > 0 && row(`${base}/help`, <MessageCircleQuestion className="size-[18px]" />, H.requests, undefined, undefined, <RedCount n={helpUnread} />)}
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}
