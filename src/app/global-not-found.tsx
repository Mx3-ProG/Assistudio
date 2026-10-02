import type { Metadata } from "next";
import { SystemState } from "@/components/ui/system-state";
import "./globals.css";

export const metadata: Metadata = {
  title: "Page introuvable — Studio ATS",
  description: "Cette page Studio ATS n’existe pas ou n’est plus disponible.",
};

export default function GlobalNotFound() {
  return (
    <html lang="fr" data-theme="light">
      <body>
        <SystemState code="404" eyebrow="Erreur 404" title="Cette page est hors cadre."
          body="L’adresse a peut-être changé ou le lien n’est plus disponible. Vous pouvez revenir en arrière ou retrouver Studio ATS."
          locale="fr" homeLabel="Accueil" backLabel="Page précédente" />
      </body>
    </html>
  );
}
