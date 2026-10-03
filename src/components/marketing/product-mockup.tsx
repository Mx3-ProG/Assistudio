"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { BarChart3, CalendarDays, Images, Inbox, Route, Users } from "lucide-react";
import { useI18n } from "@/components/providers";
import { PRODUCT_CONTACTS, PRODUCT_JOURNEY, PRODUCT_LEADS, PRODUCT_PORTFOLIO, PRODUCT_TOUR, type ProductTourFeature } from "@/content/product-showcase";
import { trackOnce } from "@/lib/analytics/client";
import { cn } from "@/lib/cn";

const ICONS = {
  portfolio: Images,
  leads: Inbox,
  contacts: Users,
  appointments: CalendarDays,
  journey: Route,
  analytics: BarChart3,
} satisfies Record<ProductTourFeature, typeof Images>;

/** Interactive product tour built from real delivered or demonstration interfaces. */
export function ProductMockup() {
  const { t } = useI18n();
  const [active, setActive] = useState<ProductTourFeature>("leads");
  const [auto, setAuto] = useState(true);
  const screen = PRODUCT_TOUR.find((item) => item.feature === active) ?? PRODUCT_TOUR[0];
  const carouselScreens = active === "portfolio"
    ? PRODUCT_PORTFOLIO
    : active === "leads"
      ? PRODUCT_LEADS
    : active === "contacts"
      ? PRODUCT_CONTACTS
      : active === "journey"
        ? PRODUCT_JOURNEY
        : null;

  useEffect(() => {
    if (!auto || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      setActive((feature) => {
        const index = PRODUCT_TOUR.findIndex((item) => item.feature === feature);
        return PRODUCT_TOUR[(index + 1) % PRODUCT_TOUR.length].feature;
      });
    }, 4200);
    return () => window.clearInterval(id);
  }, [auto]);

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr] lg:gap-10">
      <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0" role="tablist">
        {PRODUCT_TOUR.map(({ feature }) => {
          const Icon = ICONS[feature];
          return (
            <li key={feature}>
              <button
                type="button"
                id={`studio-tab-${feature}`}
                role="tab"
                aria-selected={active === feature}
                aria-controls="studio-product-panel"
                tabIndex={active === feature ? 0 : -1}
                onClick={() => {
                  setActive(feature);
                  setAuto(false);
                  trackOnce("studio-product-demo", "studio_demo_interaction", {
                    placement: "product_tour",
                    meta: { feature },
                  });
                }}
                onKeyDown={(event) => {
                  if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"].includes(event.key)) return;
                  event.preventDefault();
                  const current = PRODUCT_TOUR.findIndex((item) => item.feature === feature);
                  const nextIndex = event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? PRODUCT_TOUR.length - 1
                      : (current + (["ArrowRight", "ArrowDown"].includes(event.key) ? 1 : -1) + PRODUCT_TOUR.length) % PRODUCT_TOUR.length;
                  const next = PRODUCT_TOUR[nextIndex].feature;
                  setActive(next);
                  setAuto(false);
                  document.getElementById(`studio-tab-${next}`)?.focus();
                }}
                className={cn(
                  "flex w-full items-center gap-3 whitespace-nowrap rounded-2xl px-4 py-3 text-start text-[14px] font-medium transition",
                  active === feature ? "bg-surface text-fg shadow-md ring-1 ring-line" : "text-muted hover:text-fg",
                )}
              >
                <Icon className={cn("size-4", active === feature && "text-accent")} />
                {t.home.features[feature]}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="relative min-w-0">
        <div className="absolute -inset-3 -z-10 rounded-[40px] bg-gradient-to-br from-accent/20 via-transparent to-accent-2/20 blur-2xl sm:-inset-6" />
        <div className="glass overflow-hidden rounded-[22px] shadow-lift">
          <div className="flex items-center gap-1.5 border-b border-line px-4 py-3">
            <span className="size-2.5 rounded-full bg-[#ff5f57]" />
            <span className="size-2.5 rounded-full bg-[#febc2e]" />
            <span className="size-2.5 rounded-full bg-[#28c840]" />
            <span className="ms-3 truncate rounded-md bg-surface-2 px-3 py-1 text-[11px] text-muted">
              studio · {t.home.features[active]}
            </span>
          </div>
          <div
            key={active}
            id="studio-product-panel"
            role="tabpanel"
            aria-labelledby={`studio-tab-${active}`}
            className="animate-rise bg-surface-2 p-2 sm:p-4"
          >
            {carouselScreens ? (
              <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto rounded-xl">
                {carouselScreens.map((item, index) => (
                  <div key={item.key} className="w-[92%] shrink-0 snap-start overflow-hidden rounded-xl border border-line bg-surface shadow-md">
                    <Image
                      src={item.image}
                      width={item.width}
                      height={item.height}
                      sizes="(max-width: 1024px) 92vw, 700px"
                      alt={`${t.home.features[active]} ${index + 1}`}
                      className="h-auto w-full"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-md">
                <Image
                src={screen.image}
                width={screen.width}
                height={screen.height}
                sizes={active === "analytics" ? "(max-width: 640px) 78vw, 440px" : "(max-width: 1024px) 100vw, 760px"}
                alt={t.home.features[active]}
                className={active === "analytics" ? "mx-auto h-auto max-h-[520px] w-auto sm:max-h-[620px]" : "h-auto w-full"}
              />
              </div>
            )}
          </div>
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-muted">{t.studio.productCaptureNote}</p>
      </div>
    </div>
  );
}
