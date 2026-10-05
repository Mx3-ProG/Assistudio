"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Info } from "lucide-react";
import { useI18n } from "@/components/providers";
import { fmt } from "@/i18n/format";

type TipKey = "attribution" | "stages" | "pending";

/**
 * ⓘ next to a term whose meaning isn't obvious. Opens on tap/click (touch
 * friendly) and on mouse hover; closes on Escape or a click elsewhere.
 * Use sparingly — only where the label alone isn't self-explanatory.
 */
export function InfoTip({ tip }: { tip: TipKey }) {
  const { t } = useI18n();
  const T = t.hp.tips[tip];
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btn = useRef<HTMLButtonElement>(null);
  const id = useId();

  const place = () => {
    const r = btn.current?.getBoundingClientRect();
    if (!r) return;
    const w = Math.min(280, window.innerWidth - 32);
    setPos({ top: r.bottom + 8, left: Math.min(Math.max(r.left + r.width / 2 - w / 2, 16), window.innerWidth - w - 16) });
  };
  const show = (pin: boolean) => { place(); setOpen(true); if (pin) setPinned(true); };
  const hide = () => { setOpen(false); setPinned(false); };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (!btn.current?.parentElement?.contains(e.target as Node)) hide(); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") hide(); };
    const onMove = () => hide();
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onMove, { passive: true, capture: true });
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onMove, { capture: true });
    };
  }, [open]);

  return (
    <span className="relative inline-flex align-middle">
      <button ref={btn} type="button" aria-label={fmt(t.hp.tips.label, { name: T.name })} aria-expanded={open} aria-describedby={open ? id : undefined}
        onClick={() => (open && pinned ? hide() : show(true))}
        onPointerEnter={(e) => { if (e.pointerType === "mouse" && !open) show(false); }}
        onPointerLeave={(e) => { if (e.pointerType === "mouse" && !pinned) setOpen(false); }}
        className="ms-1.5 grid size-7 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-accent focus-visible:text-accent">
        <Info className="size-4" />
      </button>
      {open && (
        <span id={id} role="tooltip" style={{ top: pos.top, left: pos.left, width: Math.min(280, typeof window === "undefined" ? 280 : window.innerWidth - 32) }}
          className="fixed z-[60] rounded-2xl border border-line bg-bg-elevated p-3.5 text-start text-[13px] font-normal leading-relaxed tracking-normal text-fg-2 shadow-lift">
          <span className="mb-1 block text-[13px] font-semibold text-fg">{T.name}</span>
          {T.body}
        </span>
      )}
    </span>
  );
}
