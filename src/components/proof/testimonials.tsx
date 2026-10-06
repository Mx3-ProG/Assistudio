import type { PublicTestimonial } from "@/lib/proof";
import { cn } from "@/lib/cn";
import { TestimonialCard } from "./testimonial-card";
import { ProofRail } from "./proof-rail";

/**
 * Testimonials for one placement. Renders nothing without approved, consented
 * reviews: an empty slot is never filled with invented quotes.
 */
export function Testimonials({ items, title, subtitle, className }: {
  items: PublicTestimonial[]; title?: string; subtitle?: string; className?: string;
}) {
  if (!items.length) return null;
  return (
    <div className={className}>
      {(title || subtitle) && (
        <div className="mb-6 max-w-2xl">
          {title && <h3 className="text-[22px] font-semibold tracking-tight sm:text-[26px]">{title}</h3>}
          {subtitle && <p className="mt-1.5 text-[14.5px] text-muted">{subtitle}</p>}
        </div>
      )}
      {items.length < 3 ? (
        <ul className={cn("grid gap-4", items.length === 2 && "md:grid-cols-2")}>
          {items.map((it) => <li key={it.id} className="proof-reveal max-w-3xl"><TestimonialCard item={it} /></li>)}
        </ul>
      ) : (
        <ProofRail>{items.map((it) => <TestimonialCard key={it.id} item={it} />)}</ProofRail>
      )}
    </div>
  );
}
