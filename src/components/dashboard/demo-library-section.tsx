import Link from "next/link";
import { ArrowRight, ExternalLink, MonitorPlay } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { studioDemos, studioDemoTiers } from "@/lib/demos";

const demoVisuals: Record<(typeof studioDemos)[number]["slug"], string> = {
  "ines-conciergerie":
    "linear-gradient(90deg,rgba(20,16,12,.12),rgba(20,16,12,.42)),url('/demo-sites/ines/assets/ines-darges-conciergerie-mediterranee-pyrenees-orientales.jpg')",
  "vortex-r":
    "radial-gradient(circle at 50% 40%,rgba(178,22,29,.42),transparent 32%),linear-gradient(145deg,#181818 0%,#030303 72%)",
  "wild-haven":
    "linear-gradient(90deg,rgba(5,20,13,.12),rgba(5,20,13,.5)),url('/demo-sites/camping/assets/hero-camping-C6sYGza3.jpg')",
  "isabelle-rouxel":
    "linear-gradient(90deg,rgba(24,35,27,.08),rgba(24,35,27,.48)),url('/demo-sites/isabelle-rouxel/assets/hero-cabinet-AFMZZqz3.jpg')",
  "garage-du-lac":
    "linear-gradient(125deg,transparent 0 54%,rgba(207,34,40,.92) 54% 61%,transparent 61%),radial-gradient(circle at 30% 35%,#3b4657,#111722 62%)",
  "instant-precieux":
    "linear-gradient(90deg,rgba(8,9,12,.08),rgba(8,9,12,.58)),url('/demo-sites/instant-precieux/hero-photographer.jpg')",
  "cadence-mada":
    "radial-gradient(circle at 78% 18%,rgba(118,208,176,.8),transparent 23%),linear-gradient(145deg,#173f38,#071e1a)",
  "customer-mada":
    "radial-gradient(circle at 24% 28%,#d2ff72 0 6%,transparent 7%),radial-gradient(circle at 66% 54%,#ff7b59 0 10%,transparent 11%),#0b1113",
  "mada-supply":
    "radial-gradient(ellipse at center,rgba(64,216,255,.18),transparent 52%),linear-gradient(145deg,#061017,#0d2430)",
};

export function DemoLibrarySection({ locale }: { locale: Locale }) {
  const fr = locale === "fr";

  return (
    <section aria-labelledby="demo-library-title" className="card overflow-hidden p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-2xl">
          <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-accent">
            <MonitorPlay className="size-4" aria-hidden />
            {fr ? "Bibliothèque de démonstration" : "Demo library"}
          </p>
          <h2 id="demo-library-title" className="mt-1 text-[19px] font-semibold tracking-tight">
            {fr ? "Démos One, Pro et Premium prêtes à présenter" : "One, Pro and Premium demos ready to present"}
          </h2>
          <p className="mt-1 text-[13px] leading-relaxed text-muted">
            {fr
              ? "Ouvrez un exemple pendant un rendez-vous et laissez le prospect explorer une vraie expérience Studio ATS."
              : "Open an example during a meeting and let the prospect explore a real Studio ATS experience."}
          </p>
        </div>
        <Link
          href={`/${locale}/demos`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-accent hover:underline"
        >
          {fr ? "Voir toute la galerie" : "View the full gallery"}
          <ArrowRight className="flip-rtl size-4" aria-hidden />
        </Link>
      </div>

      <div className="mt-5 space-y-6">
        {studioDemoTiers.map((tier) => (
          <div key={tier}>
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Studio {tier.toUpperCase()}</h3>
            <ul className="grid gap-3 lg:grid-cols-3">
              {studioDemos.filter((demo) => demo.tier === tier).map((demo) => (
                <li key={demo.slug}>
                  <Link
                    href={`/${locale}/demos/${demo.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex min-h-48 overflow-hidden rounded-2xl border border-white/10 bg-[#111] p-4 text-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-soft"
                  >
                    <span
                      aria-hidden
                      className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-[1.04]"
                      style={{ backgroundImage: demoVisuals[demo.slug] }}
                    />
                    <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/10" />
                    <span className="relative mt-auto block w-full">
                      <span className="flex items-center justify-between gap-3">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/70">{tier.toUpperCase()} · {demo.category}</span>
                        <ExternalLink className="size-4 shrink-0 text-white/75 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
                      </span>
                      <strong className="mt-1 block text-[19px] leading-tight">{demo.title}</strong>
                      <span className="mt-2 line-clamp-2 block text-[12.5px] leading-relaxed text-white/75">
                        {fr ? demo.description : demo.descriptionEn}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11.5px] text-muted">
        {fr
          ? "Données de démonstration uniquement : aucun appel, paiement ou envoi réel."
          : "Demonstration data only: no real calls, payments, or submissions."}
      </p>
    </section>
  );
}
