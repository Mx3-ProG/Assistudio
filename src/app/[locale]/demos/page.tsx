import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { studioDemos } from "@/lib/demos";
import styles from "./demos.module.css";

export const metadata: Metadata = {
  title: "Démonstrations | Studio ATS",
  description: "Découvrez les démonstrations Studio One, Pro et Premium en conditions réelles.",
  robots: { index: false, follow: false },
};

export default async function DemosPage({ params }: PageProps<"/[locale]/demos">) {
  const { locale } = (await params) as { locale: Locale };
  const fr = locale === "fr";
  const groups = [
    {
      tier: "one" as const,
      label: "ONE",
      title: fr ? "Une présence professionnelle, prête à vous appartenir." : "A professional presence, ready to be yours.",
      description: fr ? "Des expériences ciblées et responsives qui montrent le niveau de finition de Studio One." : "Focused, responsive experiences that show the finish you can expect from Studio One.",
    },
    {
      tier: "pro" as const,
      label: "PRO",
      title: fr ? "Des parcours métier plus complets." : "More complete business journeys.",
      description: fr ? "Plus de pages, plus d'interactions et des parcours de devis ou de réservation simulés." : "More pages, more interactions, plus simulated quote and booking journeys.",
    },
    {
      tier: "premium" as const,
      label: "PREMIUM",
      title: fr ? "Des logiciels métier qui se manipulent vraiment." : "Business software you can actually use.",
      description: fr ? "Chaque démonstration conserve l'interface et les fonctions propres à son projet, avec des données locales sans impact réel." : "Each demo keeps its project's own interface and functions, using local data with no real-world impact.",
    },
  ];

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href={`/${locale}/studio`}>
          <span className={styles.brandMark}>S</span>
          Studio ATS
        </Link>
        <Link className={styles.back} href={`/${locale}/studio`}>
          <ArrowLeft size={15} aria-hidden />
          {fr ? "Retour à Studio" : "Back to Studio"}
        </Link>
      </header>

      <section className={styles.hero}>
        <span className={styles.eyebrow}>{fr ? "Démonstrations Studio" : "Studio demonstrations"}</span>
        <h1>
          <span className={styles.titleLine}>{fr ? "3 univers," : "3 worlds,"}</span>{" "}
          <span className={styles.titleLine}>{fr ? "une même exigence," : "one standard,"}</span>{" "}
          <span className={styles.titleSignature}>{fr ? "le sur-mesure" : "made to measure"}</span>
        </h1>
        <p>
          {fr
            ? "Explorez des sites réellement manipulables, pensés pour montrer ce que votre entreprise peut devenir avec Studio ATS."
            : "Explore live, interactive websites designed to show what your business can become with Studio ATS."}
        </p>
      </section>

      <div className={styles.collections}>
        {groups.map((group) => (
          <section className={styles.collection} aria-labelledby={`tier-${group.tier}`} key={group.tier}>
            <header className={styles.collectionHeader}>
              <span className={styles.tierBadge}>{group.label}</span>
              <div>
                <h2 id={`tier-${group.tier}`}>{group.title}</h2>
                <p>{group.description}</p>
              </div>
            </header>
            <div className={styles.grid}>
              {studioDemos.filter((demo) => demo.tier === group.tier).map((demo) => (
                <Link className={styles.card} href={`/${locale}/demos/${demo.slug}`} key={demo.slug}>
                  <div className={`${styles.visual} ${styles[demo.accent]}`} aria-hidden />
                  <div className={styles.cardBody}>
                    <span className={styles.category}>{group.label} · {demo.category}</span>
                    <div className={styles.cardTitleRow}>
                      <h2>{demo.title}</h2>
                      <span className={styles.arrow}><ArrowUpRight size={18} aria-hidden /></span>
                    </div>
                    <p className={styles.cardDescription}>{fr ? demo.description : demo.descriptionEn}</p>
                    <div className={styles.chips}>
                      {(fr ? demo.highlights : demo.highlightsEn).map((highlight) => (
                        <span className={styles.chip} key={highlight}>{highlight}</span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
