import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { env } from "@/lib/env";

// Public, indexable pages only. Dashboards, admin and private sales pages are excluded.
const PUBLIC_PATHS = ["", "/studio", "/pricing", "/partners", "/faq", "/about", "/contact", "/security", "/legal", "/privacy", "/cookies", "/terms", "/affiliate-terms"];

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PATHS.map((path) => ({
    url: `${env.siteUrl}/en${path}`,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : path === "/studio" ? 0.9 : 0.5,
    alternates: { languages: Object.fromEntries(locales.map((l) => [l, `${env.siteUrl}/${l}${path}`])) },
  }));
}
