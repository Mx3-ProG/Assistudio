"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  Camera, Gem, Video, Ruler, Sofa, Hammer, CookingPot, Leaf, Waves, Briefcase, Users, Sparkles, X, ArrowUpRight,
  Wrench, Car, HardHat, HeartPulse, Megaphone, Store, User, Handshake,
} from "lucide-react";
import { useI18n } from "@/components/providers";
import { CopyButton } from "@/components/ui/copy-button";
import { marketContent, type Market } from "@/content/markets";

const ICONS: Record<string, typeof Camera> = {
  camera: Camera, rings: Gem, video: Video, ruler: Ruler, sofa: Sofa, hammer: Hammer, kitchen: CookingPot,
  leaf: Leaf, waves: Waves, briefcase: Briefcase, users: Users, sparkles: Sparkles,
  wrench: Wrench, car: Car, hardhat: HardHat, health: HeartPulse, megaphone: Megaphone, store: Store, user: User, handshake: Handshake,
};
export function MarketIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Sparkles;
  return <Icon className={className} />;
}

export function MarketsGrid({ markets, action }: { markets: Market[]; action?: (m: Market) => React.ReactNode }) {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState<Market | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);

  const c = open ? marketContent(open, locale) : null;

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {markets.map((m) => {
          const mc = marketContent(m, locale);
          return (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => setOpen(m)}
                className="group relative flex h-full min-h-48 w-full flex-col items-start gap-4 overflow-hidden rounded-[var(--radius)] border border-white/15 bg-[#090b16] p-4 text-start text-white shadow-sm transition hover:-translate-y-0.5 hover:border-white/25 hover:shadow-md sm:min-h-56 sm:p-5"
              >
                <Image
                  src={`/images/markets/${m.slug}.webp`}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 270px, (min-width: 640px) 33vw, 50vw"
                  className="object-cover transition duration-500 group-hover:scale-[1.035]"
                />
                <span aria-hidden className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/35 to-black/90" />
                <span className="relative grid size-10 place-items-center rounded-xl border border-white/20 bg-black/35 text-white shadow-sm backdrop-blur-md">
                  <MarketIcon name={m.icon} className="size-5" />
                </span>
                <span className="relative mt-auto text-[14px] font-semibold leading-snug drop-shadow-sm sm:text-[15px]">{mc.name}</span>
                <span className="relative inline-flex items-center gap-1 text-[12px] text-white/75 group-hover:text-white">
                  {t.home.marketAngle} <ArrowUpRight className="flip-rtl size-3.5" />
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <dialog
        ref={dialog}
        onClose={() => setOpen(null)}
        onClick={(e) => e.target === dialog.current && setOpen(null)}
        className="m-auto w-[min(640px,calc(100vw-24px))] max-h-[88dvh] rounded-[24px] border border-line bg-bg-elevated p-0 text-fg shadow-lift backdrop:bg-black/40 backdrop:backdrop-blur-sm"
      >
        {open && c && (
          <div className="p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-accent-soft text-accent">
                  <MarketIcon name={open.icon} className="size-5" />
                </span>
                <h3 className="text-xl font-semibold tracking-tight">{c.name}</h3>
              </div>
              <button type="button" onClick={() => setOpen(null)} className="grid size-9 place-items-center rounded-full bg-surface-2" aria-label={t.common.close}>
                <X className="size-4" />
              </button>
            </div>
            <dl className="mt-6 grid gap-5 sm:grid-cols-2">
              {([["marketWho", c.who], ["marketWhy", c.why], ["marketProblem", c.problem], ["marketAngle", c.angle]] as const).map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[12px] font-semibold uppercase tracking-[0.1em] text-muted">{t.home[k]}</dt>
                  <dd className="mt-1.5 text-[14px] leading-relaxed text-fg-2">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 rounded-2xl bg-surface-2 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[12px] font-semibold uppercase tracking-[0.1em] text-muted">{t.home.marketMessage}</span>
                <CopyButton value={c.message} />
              </div>
              <p className="whitespace-pre-line text-[14px] leading-relaxed">{c.message}</p>
            </div>
            {action && <div className="mt-6 flex justify-end">{action(open)}</div>}
          </div>
        )}
      </dialog>
    </>
  );
}
