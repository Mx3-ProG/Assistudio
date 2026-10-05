import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ExternalLink, LayoutDashboard } from "lucide-react";
import { notFound } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { getStudioDemo, studioDemos } from "@/lib/demos";
import styles from "../demos.module.css";

export function generateStaticParams() {
  return studioDemos.map((demo) => ({ slug: demo.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/demos/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const demo = getStudioDemo(slug);
  if (!demo) return {};
  return {
    title: `${demo.title} | Démonstration Studio ATS`,
    description: demo.description,
    robots: { index: false, follow: false },
  };
}

export default async function DemoViewerPage({ params }: PageProps<"/[locale]/demos/[slug]">) {
  const { locale, slug } = (await params) as { locale: Locale; slug: string };
  const demo = getStudioDemo(slug);
  if (!demo) notFound();
  const fr = locale === "fr";

  return (
    <main className={styles.viewerPage}>
      <header className={styles.viewerBar}>
        <Link className={styles.viewerBack} href={`/${locale}/demos`}>
          <ArrowLeft size={16} aria-hidden />
          <span>{fr ? "Toutes les démos" : "All demos"}</span>
        </Link>
        <div className={styles.viewerTitle}>
          <strong>{demo.title}</strong>
          <span>{fr ? "Données de démonstration · aucune action réelle" : "Demo data · no real-world action"}</span>
        </div>
        <div className={styles.viewerActions}>
          {demo.adminHref && <a className={styles.viewerAdmin} href={demo.adminHref} target="_blank" rel="noopener noreferrer">
            <LayoutDashboard size={15} aria-hidden />
            <span>{fr ? "Dashboard démo" : "Demo dashboard"}</span>
          </a>}
          <a className={styles.viewerOpen} href={demo.href} target="_blank" rel="noopener noreferrer">
            <span>{fr ? "Plein écran" : "Full screen"}</span>
            <ExternalLink size={15} aria-hidden />
          </a>
        </div>
      </header>
      <iframe
        className={styles.frame}
        src={demo.href}
        title={`${demo.title} — ${fr ? "démonstration" : "demo"}`}
        sandbox="allow-downloads allow-forms allow-modals allow-pointer-lock allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
        allow="accelerometer; gyroscope; fullscreen"
      />
    </main>
  );
}
