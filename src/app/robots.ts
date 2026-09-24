import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/*/dashboard", "/*/admin", "/*/p/", "/s/", "/api/", "/*/login", "/*/register", "/*/forgot"] }],
    sitemap: `${env.siteUrl}/sitemap.xml`,
  };
}
