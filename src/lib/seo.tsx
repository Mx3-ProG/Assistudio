import type { Metadata } from "next";
import { locales, localeMeta, defaultLocale, type Locale } from "@/i18n/config";
import { env } from "@/lib/env";

/** Canonical + hreflang + OpenGraph + Twitter for a public, localised page. */
export function pageMetadata(locale: Locale, path: string, title: string, description: string, opts: { noindex?: boolean } = {}): Metadata {
  const url = `${env.siteUrl}/${locale}${path}`;
  const languages: Record<string, string> = Object.fromEntries(locales.map((l) => [l, `${env.siteUrl}/${l}${path}`]));
  languages["x-default"] = `${env.siteUrl}/${defaultLocale}${path}`;
  return {
    title,
    description,
    alternates: { canonical: url, languages },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: "STUDIO",
      locale: localeMeta[locale].intl.replace("-", "_"),
    },
    twitter: { card: "summary_large_image", title, description },
    robots: opts.noindex ? { index: false, follow: false, nocache: true } : { index: true, follow: true },
  };
}

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is escaped for "<" to prevent script injection.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
