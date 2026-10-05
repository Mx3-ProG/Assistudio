import Link from "next/link";
import { ArrowRight, ArrowUpRight, MousePointerClick } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { studioDemos, studioDemoTiers } from "@/lib/demos";
import demoStyles from "@/app/[locale]/demos/demos.module.css";

const tierCopy = {
  fr: {
    one: { label: "Studio One", text: "Une présence claire, responsive et prête à l'emploi." },
    pro: { label: "Studio Pro", text: "Un site complet avec parcours métier et espace d'administration." },
    premium: { label: "Studio Premium", text: "Un écosystème numérique complet que vous pouvez réellement manipuler." },
  },
  en: {
    one: { label: "Studio One", text: "A clear, responsive online presence that is ready to use." },
    pro: { label: "Studio Pro", text: "A complete website with business journeys and an admin workspace." },
    premium: { label: "Studio Premium", text: "A complete digital ecosystem you can actually interact with." },
  },
} as const;

export function StudioDemoShowcase({ locale }: { locale: Locale }) {
  const fr = locale === "fr";
  const copy = fr ? tierCopy.fr : tierCopy.en;

  return (
    <section id="demos" className="scroll-mt-20 overflow-hidden border-y border-line bg-surface-2/55 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-7 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-accent">
              <MousePointerClick className="size-4" aria-hidden />
              {fr ? "Démonstrations utilisables" : "Interactive demonstrations"}
            </p>
            <h2 className="display mt-4 text-balance text-[42px] sm:text-[62px]">
              {fr ? "Testez ce que chaque offre peut devenir." : "Try what each offer can become."}
            </h2>
          </div>
          <p className="max-w-xl text-[16px] leading-relaxed text-muted lg:justify-self-end">
            {fr
              ? "Ouvrez chaque projet, parcourez ses pages et manipulez ses fonctions. Tout repose sur des données de démonstration : aucune action, réservation ou transaction réelle."
              : "Open each project, browse its pages and interact with its features. Everything uses demo data: no real action, booking or transaction is performed."}
          </p>
        </div>

        <div className="mt-14 space-y-14">
          {studioDemoTiers.map((tier) => {
            const demos = studioDemos.filter((demo) => demo.tier === tier);
            return (
              <div key={tier}>
                <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-accent">{copy[tier].label}</p>
                    <p className="mt-1 text-[14px] text-muted">{copy[tier].text}</p>
                  </div>
                  <span className="text-[12px] font-medium text-muted">{demos.length} {fr ? "démos" : "demos"}</span>
                </div>
                <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 lg:grid-cols-3">
                  {demos.map((demo) => (
                    <li key={demo.slug} className="w-[86%] shrink-0 snap-start sm:w-auto">
                      <Link
                        href={`/${locale}/demos/${demo.slug}`}
                        className="group block h-full overflow-hidden rounded-[26px] border border-line bg-surface shadow-sm transition duration-300 hover:-translate-y-1 hover:border-line-strong hover:shadow-lift focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-soft"
                      >
                        <div className={`${demoStyles.visual} ${demoStyles[demo.accent]} !min-h-56 sm:!min-h-64`} aria-hidden />
                        <div className="p-5 sm:p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-muted">{demo.category}</p>
                              <h3 className="mt-1 text-[22px] font-semibold tracking-tight">{demo.title}</h3>
                            </div>
                            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-2 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:bg-fg group-hover:text-bg">
                              <ArrowUpRight className="size-4" aria-hidden />
                            </span>
                          </div>
                          <p className="mt-3 line-clamp-3 text-[13px] leading-relaxed text-muted">{fr ? demo.description : demo.descriptionEn}</p>
                          <span className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent">
                            {fr ? "Ouvrir la démo" : "Open demo"}<ArrowRight className="size-3.5 transition group-hover:translate-x-1" aria-hidden />
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <Link href={`/${locale}/demos`} className="inline-flex h-12 items-center gap-2 rounded-full border border-line-strong bg-surface px-6 text-[14px] font-medium transition hover:bg-fg hover:text-bg">
            {fr ? "Voir la galerie complète" : "View the full gallery"}<ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
