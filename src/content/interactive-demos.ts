import type { LocalizedText } from "./help-videos.ts";

/**
 * Interactive mini demos (Documents → Demos): small self-contained pages a
 * prospect or client can try for themselves (a booking flow, a quote form…).
 *
 * TO ADD A DEMO
 *   1. Drop the files in public/interactive-demos/<slug>/ with an index.html
 *      entry point (relative paths for its own css/js/images).
 *   2. Add an entry below with `src: "/interactive-demos/<slug>/index.html"`
 *      (or an absolute https URL if the demo is hosted elsewhere) and,
 *      optionally, a `thumb` screenshot.
 *   3. `npm test` checks that local files exist and that texts have en + fr.
 *
 * Each demo appears on /studio (#demos, public page /[locale]/demos/<slug>)
 * and in Documents → Demos for partners.
 *
 * Demos are shown in a sandboxed iframe WITHOUT same-origin access, so a demo
 * can run scripts but cannot read the partner's session. A demo that needs
 * storage must keep it in memory. Demos are always labelled as demonstrations:
 * never present one as a real client site, and no figures or results claims.
 */
export interface InteractiveDemo {
  slug: string;
  /** The Studio offer this demo shows (Studio One / Pro / Premium). */
  tier?: "one" | "pro" | "premium";
  title: LocalizedText;
  description: LocalizedText;
  /** Sector it illustrates (free text, shown as a badge). */
  sector?: LocalizedText;
  /**
   * Entry point: /interactive-demos/<slug>/index.html or an https URL.
   * Undefined = announced but not online yet ("coming soon" card, no page).
   */
  src?: string;
  /** Screenshot under /public, ideally 16:10. */
  thumb?: string;
}

export const INTERACTIVE_DEMOS: InteractiveDemo[] = [
  {
    slug: "studio-one",
    tier: "one",
    title: { en: "Studio One", fr: "Studio One" },
    description: {
      en: "A one-page site ready to use: a clear page that presents your business.",
      fr: "Un site one-page prêt à l’emploi : une page claire pour présenter votre activité.",
    },
    // TODO: set src (and thumb) once the Studio One demo files are in public/interactive-demos/studio-one/.
  },
  {
    slug: "studio-pro",
    tier: "pro",
    title: { en: "Studio Pro", fr: "Studio Pro" },
    description: {
      en: "A complete, customisable site with its admin dashboard, content management and built-in requests.",
      fr: "Un site complet et personnalisable, avec son dashboard administrateur, la gestion de contenus et les demandes intégrées.",
    },
    // TODO: set src (and thumb) once the Studio Pro demo files are in public/interactive-demos/studio-pro/.
  },
  {
    slug: "studio-premium",
    tier: "premium",
    title: { en: "Studio Premium", fr: "Studio Premium" },
    description: {
      en: "Your site, contacts, requests, follow-ups and statistics in one ecosystem operated by Studio.",
      fr: "Votre site, vos contacts, vos demandes, vos relances et vos statistiques réunis dans un écosystème opéré par Studio.",
    },
  },
];

export type LiveDemo = InteractiveDemo & { src: string };
export const isLive = (d: InteractiveDemo): d is LiveDemo => Boolean(d.src);

/** Only demos that are online can be opened. */
export const demoBySlug = (slug: string): LiveDemo | undefined => INTERACTIVE_DEMOS.filter(isLive).find((d) => d.slug === slug);
