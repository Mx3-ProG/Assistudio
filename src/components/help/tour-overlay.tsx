"use client";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { useI18n } from "@/components/providers";
import { fmt } from "@/i18n/format";
import { TOUR_STEPS, type TourPlacement } from "@/lib/help/tour";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useHelp } from "./help-context";

const PAD = 6;
const GAP = 12;
const BUBBLE_W = 340;
/** Give up on a missing target after this long and move on. */
const FIND_TIMEOUT = 3500;

/** First element carrying `data-tour="id"` that is actually on screen (the sidebar is hidden on phones, the tab bar on desktop…). */
function visibleTarget(id: string): HTMLElement | null {
  for (const el of document.querySelectorAll<HTMLElement>(`[data-tour="${id}"]`)) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden") return el;
  }
  return null;
}

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * The guided tour: dims the page, lights up one real element, explains it in a
 * bubble placed beside it (a bottom/top card on phones), and navigates between
 * pages on "Next". A blocker under the light catches every click, so the tour
 * can never trigger an action by itself.
 */
export function TourOverlay() {
  const { t, locale } = useI18n();
  const T = t.hp.tour;
  const { state, goToStep, quitTour, finishTour, update } = useHelp();
  const router = useRouter();
  const pathname = usePathname();
  const index = Math.min(state.tour.step, TOUR_STEPS.length - 1);
  const step = TOUR_STEPS[index];
  // Element and its box are tied to the step + page they were found for, so a stale one is never lit.
  const key = `${index}:${pathname}`;
  const [found, setFound] = useState<{ key: string; el: HTMLElement } | null>(null);
  const [box, setBox] = useState<{ key: string; rect: DOMRect } | null>(null);
  const el = found?.key === key ? found.el : null;
  const rect = el && box?.key === key ? box.rect : null;
  const [bubble, setBubble] = useState<{ top: number; left: number } | null>(null);
  const [mobile, setMobile] = useState(false);
  const dir = useRef(1);
  const lastPush = useRef(0);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  const go = useCallback((i: number) => {
    dir.current = i >= index ? 1 : -1;
    if (i >= TOUR_STEPS.length) return finishTour();
    goToStep(Math.max(0, i));
  }, [index, finishTour, goToStep]);

  // Navigate to the step's page, then wait for its element; skip it if it never shows up.
  useEffect(() => {
    let cancelled = false;
    const want = step.route ? `/${locale}${step.route}` : null;
    if (want && pathname !== want) {
      if (Date.now() - lastPush.current > 1500) { lastPush.current = Date.now(); router.push(want); }
      const retry = setTimeout(() => { if (!cancelled) router.push(want); }, FIND_TIMEOUT);
      return () => { cancelled = true; clearTimeout(retry); };
    }
    const t0 = Date.now();
    let timer: ReturnType<typeof setTimeout>;
    const find = () => {
      if (cancelled) return;
      const node = visibleTarget(step.target);
      if (node) {
        const phone = window.innerWidth < 640;
        node.scrollIntoView({ block: phone ? "start" : "center", inline: "nearest", behavior: reducedMotion() ? "auto" : "smooth" });
        if (phone && node.getBoundingClientRect().top < 72) window.scrollBy({ top: -88 });
        setFound({ key, el: node });
        return;
      }
      if (Date.now() - t0 > FIND_TIMEOUT) {
        // Missing for this partner / screen: move on in the same direction (forward from the first step).
        const nextIndex = index + (dir.current < 0 && index > 0 ? -1 : 1);
        if (nextIndex >= TOUR_STEPS.length) finishTour(); else goToStep(nextIndex);
        return;
      }
      timer = setTimeout(find, 120);
    };
    find();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [index, step, pathname, locale, router, goToStep, finishTour, key]);

  // Hints for pages the tour already explains are not shown afterwards.
  useEffect(() => {
    if (el && step.route) update((s) => ({ ...s, seen: { ...s.seen, [step.route!]: true } }));
  }, [el, step.route, update]);

  // Follow the element while it scrolls / the layout shifts.
  useEffect(() => {
    if (!el) return;
    let raf = 0;
    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setBox({ key, rect: el.getBoundingClientRect() });
        setMobile(window.innerWidth < 640);
      });
    };
    measure();
    window.addEventListener("scroll", measure, { passive: true, capture: true });
    window.addEventListener("resize", measure);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const settle = setInterval(measure, 400); // smooth scroll / late layout
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", measure, { capture: true });
      window.removeEventListener("resize", measure);
      ro.disconnect();
      clearInterval(settle);
    };
  }, [el, key]);

  // Bubble beside the element: preferred side first, then the others; always inside the viewport.
  useLayoutEffect(() => {
    if (!rect || mobile || !bubbleRef.current) return;
    const bw = bubbleRef.current.offsetWidth, bh = bubbleRef.current.offsetHeight;
    const vw = window.innerWidth, vh = window.innerHeight;
    const rtl = document.documentElement.dir === "rtl";
    const side = (p: TourPlacement) => (p === "start" ? (rtl ? "right" : "left") : p === "end" ? (rtl ? "left" : "right") : p);
    const order = [side(step.placement), "bottom", "top", rtl ? "left" : "right", rtl ? "right" : "left"];
    const clampX = (x: number) => Math.min(Math.max(x, 12), vw - bw - 12);
    const clampY = (y: number) => Math.min(Math.max(y, 12), vh - bh - 12);
    for (const s of order) {
      if (s === "bottom" && rect.bottom + PAD + GAP + bh < vh) return setBubble({ top: rect.bottom + PAD + GAP, left: clampX(rect.left + rect.width / 2 - bw / 2) });
      if (s === "top" && rect.top - PAD - GAP - bh > 0) return setBubble({ top: rect.top - PAD - GAP - bh, left: clampX(rect.left + rect.width / 2 - bw / 2) });
      if (s === "right" && rect.right + PAD + GAP + bw < vw) return setBubble({ top: clampY(rect.top + rect.height / 2 - bh / 2), left: rect.right + PAD + GAP });
      if (s === "left" && rect.left - PAD - GAP - bw > 0) return setBubble({ top: clampY(rect.top + rect.height / 2 - bh / 2), left: rect.left - PAD - GAP - bw });
    }
    setBubble({ top: clampY(vh - bh - 16), left: clampX(vw / 2 - bw / 2) });
  }, [rect, mobile, step.placement, index]);

  useEffect(() => { if (el) nextRef.current?.focus({ preventScroll: true }); }, [el]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") quitTour();
      else if (e.key === "ArrowRight" && !e.altKey) go(index + 1);
      else if (e.key === "ArrowLeft" && !e.altKey && index > 0) go(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index, quitTour]);

  const S = T.steps[step.id];
  const last = index === TOUR_STEPS.length - 1;
  // On phones the card docks at the bottom — or at the top when the element is in the lower half (e.g. the tab bar).
  const dockTop = mobile && rect ? rect.top + rect.height / 2 > window.innerHeight / 2 : false;

  return createPortal(
    <div className="fixed inset-0 z-[80]" aria-live="polite">
      {/* Catches every click: the tour itself never presses anything. */}
      <div className={cn("absolute inset-0", !rect && "bg-[rgba(8,10,20,0.55)]")} onClick={(e) => e.stopPropagation()} />
      {rect && (
        <div
          className="pointer-events-none absolute rounded-[14px] ring-2 ring-accent transition-[top,left,width,height] duration-300 ease-out motion-reduce:transition-none"
          style={{
            top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2,
            boxShadow: "0 0 0 9999px rgba(8,10,20,0.55), 0 0 0 6px color-mix(in srgb, var(--accent) 25%, transparent)",
          }}
          aria-hidden
        />
      )}
      <div
        ref={bubbleRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-body"
        className={cn(
          "absolute rounded-[22px] border border-line bg-bg-elevated p-5 text-fg shadow-lift transition-opacity duration-200",
          mobile
            ? cn("inset-x-3", dockTop ? "top-[max(12px,env(safe-area-inset-top))]" : "bottom-[max(12px,env(safe-area-inset-bottom))]")
            : "",
          !mobile && !bubble && "opacity-0",
          !rect && "opacity-0",
        )}
        style={mobile ? undefined : { width: BUBBLE_W, top: bubble?.top ?? -9999, left: bubble?.left ?? -9999 }}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="tabular rounded-full bg-accent-soft px-2.5 py-1 text-[12px] font-semibold text-accent">{fmt(T.of, { n: index + 1, total: TOUR_STEPS.length })}</span>
          <button type="button" onClick={quitTour} aria-label={T.quit} title={T.quit}
            className="grid size-9 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-fg">
            <X className="size-4" />
          </button>
        </div>
        <h2 id="tour-title" className="mt-3 text-[17px] font-semibold leading-snug tracking-tight">{S.title}</h2>
        <p id="tour-body" className="mt-1.5 text-[14.5px] leading-relaxed text-fg-2">{S.body}</p>
        <div className="mt-4 flex gap-1" aria-hidden>
          {TOUR_STEPS.map((x, i) => <span key={x.id} className={cn("h-1 flex-1 rounded-full", i <= index ? "bg-accent" : "bg-surface-3")} />)}
        </div>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={() => go(index - 1)} disabled={index === 0}
            className={buttonClass("secondary", mobile ? "lg" : "md", "flex-1 disabled:opacity-40")}>
            <ArrowLeft className="flip-rtl size-4" />{T.prev}
          </button>
          <button ref={nextRef} type="button" onClick={() => go(index + 1)} className={buttonClass("accent", mobile ? "lg" : "md", "flex-1")}>
            {last ? T.finish : T.next}{!last && <ArrowRight className="flip-rtl size-4" />}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
