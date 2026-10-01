import { ImageResponse } from "next/og";
import { isLocale, type Locale } from "@/i18n/config";

export const alt = "Studio ATS — votre studio commercial en ligne";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const taglines: Record<Locale, string> = {
  fr: "Votre studio commercial, enfin connecté.",
  en: "Your digital sales team, all in one place.",
  nl: "Je digitale verkoopteam, op één plek.",
  es: "Tu equipo comercial digital, en un solo lugar.",
  de: "Dein digitales Vertriebsteam an einem Ort.",
  pt: "Sua equipe de vendas digital em um só lugar.",
  it: "Il tuo team commerciale digitale, in un unico posto.",
  ar: "فريق مبيعاتك الرقمي في مكان واحد.",
};

export default async function OpenGraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "fr";
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", padding: 72, color: "#101225", background: "linear-gradient(135deg, #fbfbfd 0%, #f2f3ff 58%, #e9eaff 100%)" }}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", borderRadius: 34, padding: 64, background: "linear-gradient(135deg, #fff 0%, #f8f8ff 100%)", border: "1px solid #e4e6f2" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 54, height: 54, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 16, background: "linear-gradient(135deg, #2f5bff 0%, #7a5cff 100%)" }}>
            <svg width="38" height="38" viewBox="0 0 64 64" fill="none"><path d="M13 39.5c2.15 2.65 6.18 4.15 11.62 4.15 6.75 0 10.78-2.98 10.78-7.55 0-4.32-2.96-6.2-9.72-7.56-5.14-1.03-6.74-1.88-6.74-3.78 0-1.89 2.13-3.24 5.38-3.24 3.24 0 5.93 1.08 7.55 2.97" stroke="#fff" strokeWidth="4.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div style={{ display: "flex", fontSize: 25, fontWeight: 700, letterSpacing: 5 }}>STUDIO <span style={{ color: "#2f5bff", padding: "0 10px" }}>▪</span> ATS</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 930 }}>
          <div style={{ fontSize: 62, lineHeight: 1.08, fontWeight: 700, letterSpacing: -2 }}>Studio ATS</div>
          <div style={{ fontSize: 34, lineHeight: 1.3, color: "#555a72" }}>{taglines[locale]}</div>
        </div>
        <div style={{ display: "flex", fontSize: 22, fontWeight: 600, color: "#515b88" }}>atonservice.org</div>
      </div>
    </div>,
    size,
  );
}
