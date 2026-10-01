import Image from "next/image";
import { ExternalLink } from "lucide-react";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { fmt } from "@/i18n/format";
import type { SalesContent } from "@/lib/sales/content";
import { Badge } from "@/components/ui/primitives";
import { buttonClass } from "@/components/ui/button";
import { TrackedCopy } from "@/components/sales-center/tracked-copy";
import { FavoriteButton } from "@/components/sales-center/favorite-button";
import { FallbackBadge } from "@/components/sales-center/fallback-badge";

/** A project the ambassador can show: screenshot, what was built, and ready-to-send copy. */
export function CaseStudyCard({ t, item, link, favorite, compact = false }: {
  t: Dictionary; item: SalesContent<"case_study"> & { fallback?: boolean }; link: string; favorite?: boolean; compact?: boolean;
}) {
  const b = item.body;
  const C = t.cp.caseStudy;
  const offer = b.offer ? t.pricing.plans[b.offer].name : null;
  const message = b.url ? fmt(C.shareMessage, { sector: b.sector, url: b.url, link }) : null;
  return (
    <article id={item.key} className="card flex flex-col overflow-hidden">
      {b.image && (
        <div className="relative aspect-[16/10] bg-surface-2">
          <Image src={b.image} alt={b.name} fill sizes="(min-width: 1024px) 400px, 100vw" className="object-cover object-top" />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-[16px] font-semibold leading-tight">{b.name}</h3>
            <p className="mt-0.5 text-[12.5px] text-muted">{b.sector} · {b.clientType}</p>
          </div>
          {favorite !== undefined && <FavoriteButton kind="case_study" contentKey={item.key} initial={favorite} />}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge tone={b.type === "client" ? "success" : "neutral"}>{C.types[b.type]}</Badge>
          {offer && <Badge tone="accent">{offer}</Badge>}
          <FallbackBadge show={item.fallback} label={t.sc.englishFallback} />
        </div>
        <p className="text-[14px] leading-relaxed text-fg-2">{b.description}</p>
        <p className="rounded-xl bg-accent-soft px-3 py-2 text-[13.5px]"><strong>{C.argument} · </strong>{b.argument}</p>
        {!compact && (
          <details className="group text-[13.5px]">
            <summary className="cursor-pointer select-none font-medium text-accent">{C.solution}</summary>
            <dl className="mt-2 grid gap-2">
              <div><dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">{C.problem}</dt><dd className="mt-0.5">{b.problem}</dd></div>
              <div><dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">{C.solution}</dt><dd className="mt-0.5">{b.solution}</dd></div>
              <div><dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">{C.features}</dt>
                <dd className="mt-1 flex flex-wrap gap-1.5">{b.features.map((f) => <Badge key={f}>{f}</Badge>)}</dd></div>
            </dl>
          </details>
        )}
        <div className="mt-auto flex flex-wrap gap-2 pt-1">
          {b.url && <a href={b.url} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "sm")}><ExternalLink className="size-4" />{C.view}</a>}
          {message && <TrackedCopy value={message} kind="case_study" contentKey={item.key} label={C.copyMessage} variant="accent" />}
          {b.url && <TrackedCopy value={b.url} kind="case_study" contentKey={item.key} label={C.copyLink} variant="ghost" />}
        </div>
      </div>
    </article>
  );
}
