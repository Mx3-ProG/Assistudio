"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/components/providers";
import { cn } from "@/lib/cn";

/**
 * Horizontal, swipeable list (native scroll + snap): natural swipe on phones,
 * arrow buttons on larger screens. No autoplay. RTL-safe (scrollBy follows the
 * writing direction through `dir`).
 */
export function ProofRail({ children, className, itemClass = "w-[86%] sm:w-[48%] lg:w-[32%]" }: {
  children: React.ReactNode[]; className?: string; itemClass?: string;
}) {
  const { t, locale } = useI18n();
  const ref = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const rtl = locale === "ar";

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const x = Math.abs(el.scrollLeft);
    setEdges({ start: x < 8, end: x + el.clientWidth >= el.scrollWidth - 8 });
  }, []);

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [update]);

  const go = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * (rtl ? -1 : 1) * el.clientWidth * 0.85, behavior: "smooth" });
  };

  const scrollable = !(edges.start && edges.end);
  return (
    <div className={cn("relative", className)}>
      <ul ref={ref} onScroll={update}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-3 sm:-mx-6 sm:scroll-px-6 sm:px-6">
        {children.map((child, i) => <li key={i} className={cn("shrink-0 snap-start", itemClass)}>{child}</li>)}
      </ul>
      {scrollable && (
        <div className="mt-3 hidden justify-end gap-2 sm:flex">
          <button type="button" onClick={() => go(-1)} disabled={edges.start} aria-label={t.pf.testimonials.prev}
            className="grid size-10 place-items-center rounded-full border border-line bg-surface transition hover:bg-surface-2 disabled:opacity-40">
            <ChevronLeft className="flip-rtl size-4" />
          </button>
          <button type="button" onClick={() => go(1)} disabled={edges.end} aria-label={t.pf.testimonials.next}
            className="grid size-10 place-items-center rounded-full border border-line bg-surface transition hover:bg-surface-2 disabled:opacity-40">
            <ChevronRight className="flip-rtl size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
