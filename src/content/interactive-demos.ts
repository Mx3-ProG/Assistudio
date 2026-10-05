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
  title: LocalizedText;
  description: LocalizedText;
  /** Sector it illustrates (free text, shown as a badge). */
  sector?: LocalizedText;
  /** Entry point: /interactive-demos/<slug>/index.html or an https URL. */
  src: string;
  /** Screenshot under /public, ideally 16:10. */
  thumb?: string;
}

export const INTERACTIVE_DEMOS: InteractiveDemo[] = [];

export const demoBySlug = (slug: string) => INTERACTIVE_DEMOS.find((d) => d.slug === slug);
