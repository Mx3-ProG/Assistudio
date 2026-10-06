"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import { ArrowRight, Check, Globe, Workflow, Wrench, LifeBuoy, CalendarRange, Database, X } from "lucide-react";
import { useI18n } from "@/components/providers";

type WorkKey = "website" | "crm" | "automation" | "maintenance" | "support" | "tools";

/**
 * Real screens only; services without a screen (maintenance, guidance) get an
 * icon card instead of a fake screenshot.
 */
const WORK: { key: WorkKey; icon: typeof Globe; image?: { src: string; w: number; h: number } }[] = [
  { key: "website", icon: Globe, image: { src: "/portfolio/maisonaurelia.webp", w: 1280, h: 800 } },
  { key: "crm", icon: Database, image: { src: "/showcase/prospect-dashboard.webp", w: 1920, h: 979 } },
  { key: "automation", icon: Workflow, image: { src: "/showcase/customer-journey-steps.webp", w: 1920, h: 897 } },
  { key: "maintenance", icon: Wrench },
  { key: "tools", icon: CalendarRange, image: { src: "/showcase/appointment-calendar.webp", w: 1920, h: 1089 } },
  { key: "support", icon: LifeBuoy },
];

/** "Sites web • CRM • Automatisations • …": a slow strip (paused on hover) on desktop, a swipeable row on phones. */
export function WorkBand({ ctaHref }: { ctaHref: string }) {
  const { t } = useI18n();
  const W = t.pf.work;
  const [open, setOpen] = useState<WorkKey | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const show = (k: WorkKey) => { setOpen(k); dialog.current?.showModal(); };
  const current = WORK.find((w) => w.key === open);

  const card = (w: (typeof WORK)[number], clone = false) => {
    const Icon = w.icon;
    const item = W.items[w.key];
    return (
      <li key={`${w.key}${clone ? "-c" : ""}`} data-clone={clone ? "" : undefined} aria-hidden={clone || undefined}
        className="w-[78vw] max-w-[340px] shrink-0 snap-start sm:w-[320px]">
        <button type="button" onClick={() => show(w.key)} tabIndex={clone ? -1 : undefined}
          className="group block w-full overflow-hidden rounded-[22px] border border-line bg-surface text-start shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lift focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-soft">
          <div className="relative aspect-[16/10] overflow-hidden bg-surface-2">
            {w.image ? (
              <Image src={w.image.src} alt="" width={w.image.w} height={w.image.h} sizes="340px" loading="lazy"
                className="size-full object-cover object-top transition duration-500 group-hover:scale-[1.02]" />
            ) : (
              <span className="absolute inset-0 grid place-items-center bg-[radial-gradient(60%_70%_at_50%_30%,var(--accent-soft),transparent)]">
                <Icon className="size-10 text-accent" aria-hidden />
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 p-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent"><Icon className="size-4" aria-hidden /></span>
            <div className="min-w-0">
              <p className="font-semibold leading-tight">{item.title}</p>
              <p className="mt-0.5 truncate text-[12.5px] text-muted">{item.body}</p>
            </div>
          </div>
        </button>
      </li>
    );
  };

  return (
    <div>
      <div className="proof-marquee no-scrollbar -mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
        <ul className="flex snap-x snap-mandatory gap-4 pb-3">
          {WORK.map((w) => card(w))}
          {WORK.map((w) => card(w, true))}
        </ul>
      </div>

      <dialog ref={dialog} onClose={() => setOpen(null)} onClick={(e) => { if (e.target === dialog.current) dialog.current?.close(); }}
        className="m-auto w-[min(720px,calc(100vw-32px))] overflow-hidden rounded-[26px] border border-line bg-surface p-0 text-fg shadow-lift backdrop:bg-black/50 backdrop:backdrop-blur-sm">
        {current && (
          <div>
            <div className="relative aspect-[16/9] bg-surface-2">
              {current.image ? (
                <Image src={current.image.src} alt={W.items[current.key].title} width={current.image.w} height={current.image.h}
                  sizes="(min-width: 768px) 720px, 100vw" className="size-full object-cover object-top" />
              ) : (
                <span className="absolute inset-0 grid place-items-center"><current.icon className="size-14 text-accent" aria-hidden /></span>
              )}
              <button type="button" onClick={() => dialog.current?.close()} aria-label={W.close}
                className="absolute end-3 top-3 grid size-9 place-items-center rounded-full bg-black/55 text-white backdrop-blur hover:bg-black/70">
                <X className="size-4" />
              </button>
            </div>
            <div className="p-6 sm:p-7">
              <h3 className="text-[24px] font-semibold tracking-tight">{W.items[current.key].title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-fg-2">{W.items[current.key].body}</p>
              <ul className="mt-4 grid gap-2 sm:grid-cols-3">
                {W.items[current.key].points.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-[14px]"><Check className="size-4 shrink-0 text-success" aria-hidden />{p}</li>
                ))}
              </ul>
              <p className="mt-5 text-[12px] text-muted">{current.image ? W.shotCaption : W.noShot}</p>
              <a href={ctaHref} onClick={() => dialog.current?.close()}
                className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-[14px] font-medium text-accent-fg transition hover:brightness-110">
                {W.cta}<ArrowRight className="flip-rtl size-4" />
              </a>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
