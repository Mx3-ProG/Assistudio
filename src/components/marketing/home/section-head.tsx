import { cn } from "@/lib/cn";

/** The home's section heading: eyebrow, display title, optional subtitle. */
export function SectionHead({ eyebrow, title, subtitle, center, className }: {
  eyebrow?: string; title: React.ReactNode; subtitle?: string; center?: boolean; className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", center && "mx-auto text-center", className)}>
      {eyebrow && <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-accent">{eyebrow}</p>}
      <h2 className="display mt-3 text-[34px] sm:text-[52px]">{title}</h2>
      {subtitle && <p className="mt-4 text-[17px] text-muted sm:text-[19px]">{subtitle}</p>}
    </div>
  );
}
