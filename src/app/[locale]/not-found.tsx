"use client";

import { usePathname } from "next/navigation";
import { useOptionalI18n } from "@/components/providers";
import { SystemState } from "@/components/ui/system-state";
import { defaultLocale, isLocale } from "@/i18n/config";

export default function NotFound() {
  const i18n = useOptionalI18n();
  const segment = usePathname().split("/")[1] ?? "";
  const locale = i18n?.locale ?? (isLocale(segment) ? segment : defaultLocale);
  const fallback = locale === "fr" ? {
    eyebrow: "Erreur 404",
    title: "Cette page est hors cadre.",
    body: "L’adresse a peut-être changé ou le lien n’est plus disponible. Vous pouvez revenir en arrière ou retrouver Studio ATS.",
    home: "Accueil",
    back: "Page précédente",
  } : {
    eyebrow: "Error 404",
    title: "This page is off the map.",
    body: "The address may have changed, or the link may no longer be available. You can go back or return to Studio ATS.",
    home: "Go home",
    back: "Go back",
  };
  const copy = i18n ? {
    eyebrow: i18n.t.errors.notFoundLabel,
    title: i18n.t.errors.notFoundTitle,
    body: i18n.t.errors.notFoundBody,
    home: i18n.t.errors.goHome,
    back: i18n.t.errors.goBack,
  } : fallback;

  return <SystemState code="404" eyebrow={copy.eyebrow} title={copy.title}
    body={copy.body} locale={locale} homeLabel={copy.home} backLabel={copy.back} />;
}
