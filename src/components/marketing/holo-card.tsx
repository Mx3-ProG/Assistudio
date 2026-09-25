"use client";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Card with the hover effects of React Bits' ProfileCard (reactbits.dev,
 * MIT + Commons Clause): pointer-tracked tilt, holographic shine, glare and a
 * glow behind the card. Styles live in globals.css (`.holo-*`).
 *
 * Adapted for content that must stay readable and clickable: the children sit
 * on their own layer with no blend mode, the tilt is gentler, and it only runs
 * for a mouse/pen (touch scrolls normally) without reduced motion.
 */
export function HoloCard({ children, className, glow, gradient }: {
  children: ReactNode;
  className?: string;
  /** Colour of the glow behind the card. */
  glow: string;
  /** Tint painted over the card's dark base. */
  gradient: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const clamp = (v: number, min = 0, max = 100) => Math.min(Math.max(v, min), max);
    const adjust = (v: number, tMin: number, tMax: number) => tMin + ((tMax - tMin) * v) / 100;
    let cx = 0, cy = 0, tx = 0, ty = 0, raf = 0, last = 0;

    const paint = (x: number, y: number) => {
      const px = clamp((100 / (wrap.clientWidth || 1)) * x);
      const py = clamp((100 / (wrap.clientHeight || 1)) * y);
      const vars: Record<string, string> = {
        "--pointer-x": `${px}%`,
        "--pointer-y": `${py}%`,
        "--background-x": `${adjust(px, 35, 65)}%`,
        "--background-y": `${adjust(py, 35, 65)}%`,
        "--pointer-from-left": `${px / 100}`,
        "--pointer-from-top": `${py / 100}`,
        // ProfileCard tilts up to 10°; content cards stay readable at ~5°.
        "--rotate-x": `${(-(px - 50) / 10).toFixed(3)}deg`,
        "--rotate-y": `${((py - 50) / 10).toFixed(3)}deg`,
      };
      for (const [k, v] of Object.entries(vars)) wrap.style.setProperty(k, v);
    };
    // Exponential smoothing towards the pointer (same easing as ProfileCard).
    const step = (ts: number) => {
      const dt = last ? (ts - last) / 1000 : 0;
      last = ts;
      const k = 1 - Math.exp(-dt / 0.14);
      cx += (tx - cx) * k;
      cy += (ty - cy) * k;
      paint(cx, cy);
      if (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) raf = requestAnimationFrame(step);
      else { raf = 0; last = 0; }
    };
    const target = (x: number, y: number) => {
      tx = x; ty = y;
      if (!raf) raf = requestAnimationFrame(step);
    };
    const offsets = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top] as const;
    };
    const center = () => target(wrap.clientWidth / 2, wrap.clientHeight / 2);

    const onEnter = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      wrap.dataset.active = "";
      target(...offsets(e));
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "touch" && "active" in wrap.dataset) target(...offsets(e));
    };
    const onLeave = () => {
      delete wrap.dataset.active;
      center();
    };

    cx = tx = wrap.clientWidth / 2;
    cy = ty = wrap.clientHeight / 2;
    paint(cx, cy);
    wrap.addEventListener("pointerenter", onEnter);
    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerleave", onLeave);
    return () => {
      wrap.removeEventListener("pointerenter", onEnter);
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={wrapRef} className={cn("holo-card", className)}
      style={{ "--holo-glow": glow, "--holo-gradient": gradient } as CSSProperties}>
      <div aria-hidden className="holo-glow" />
      <div className="holo-body">
        <div aria-hidden className="holo-shine" />
        <div aria-hidden className="holo-glare" />
        <div className="relative z-10 flex h-full flex-col">{children}</div>
      </div>
    </div>
  );
}
