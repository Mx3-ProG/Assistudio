import Image from "next/image";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { PRODUCT_SHOWCASE } from "@/content/product-showcase";

export function ProductShowcaseGallery({ t, compact = false }: { t: Dictionary; compact?: boolean }) {
  return (
    <section aria-labelledby="product-showcase-title">
      <div className="mb-4 max-w-2xl">
        <h2 id="product-showcase-title" className="text-[20px] font-semibold sm:text-[24px]">
          {t.studio.productCaptureTitle}
        </h2>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">{t.studio.productCaptureNote}</p>
      </div>
      <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {PRODUCT_SHOWCASE.map((item) => {
          const portrait = item.height > item.width;
          return (
            <figure
              key={item.key}
              className={compact ? "w-[82vw] max-w-[520px] shrink-0 snap-start" : "w-[88vw] max-w-[680px] shrink-0 snap-start"}
            >
              <div className="flex overflow-hidden rounded-2xl border border-line bg-surface shadow-md">
                <Image
                  src={item.image}
                  width={item.width}
                  height={item.height}
                  sizes={portrait ? "(max-width: 640px) 72vw, 420px" : compact ? "(max-width: 640px) 82vw, 520px" : "(max-width: 640px) 88vw, 680px"}
                  alt={t.home.features[item.feature]}
                  className={portrait ? "mx-auto h-auto max-h-[560px] w-auto" : "h-auto w-full"}
                />
              </div>
              <figcaption className="mt-2 text-[13px] font-medium text-fg-2">
                {t.home.features[item.feature]}
              </figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}
