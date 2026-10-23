"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { reloadIfStaleDeployment } from "@/lib/stale-deployment";

export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    if (!reloadIfStaleDeployment(error)) console.error(error);
  }, [error]);

  return (
    <html lang="fr" data-theme="light">
      <body style={{ margin: 0, background: "#fbfbfd", color: "#111114", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
        <title>Page indisponible — Studio ATS</title>
        <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 24, background: "radial-gradient(circle at 20% 10%, rgba(47,91,255,.12), transparent 35%), radial-gradient(circle at 85% 90%, rgba(122,92,255,.12), transparent 38%)" }}>
          <section style={{ width: "min(100%, 720px)", padding: "clamp(28px, 6vw, 64px)", border: "1px solid rgba(17,17,20,.08)", borderRadius: 28, background: "rgba(255,255,255,.88)", boxShadow: "0 30px 80px -40px rgba(47,91,255,.45)", textAlign: "center" }}>
            <Image src="/brand/studio-mark.png" alt="" width={112} height={112} priority style={{ width: 112, height: 112, objectFit: "contain" }} />
            <p style={{ margin: "24px 0 0", color: "#2f5bff", fontSize: 12, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase" }}>Studio ATS · Erreur temporaire</p>
            <h1 style={{ margin: "16px 0 0", fontSize: "clamp(36px, 7vw, 64px)", lineHeight: 1, letterSpacing: "-.05em" }}>La page n’a pas pu se charger.</h1>
            <p style={{ margin: "20px auto 0", maxWidth: 520, color: "#6c6c74", fontSize: 16, lineHeight: 1.7 }}>Un imprévu technique a interrompu le chargement. Vos informations restent en sécurité. Réessayez dans quelques secondes.</p>
            <div style={{ marginTop: 30, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
              <button type="button" onClick={retry} style={{ minHeight: 48, border: 0, borderRadius: 999, padding: "0 24px", background: "#2f5bff", color: "white", font: "inherit", fontWeight: 650, cursor: "pointer", boxShadow: "0 10px 28px -12px #2f5bff" }}>Réessayer</button>
              <Link href="/" style={{ minHeight: 46, display: "inline-flex", alignItems: "center", border: "1px solid rgba(17,17,20,.1)", borderRadius: 999, padding: "0 24px", color: "#111114", textDecoration: "none", fontWeight: 650 }}>Retour à l’accueil</Link>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
