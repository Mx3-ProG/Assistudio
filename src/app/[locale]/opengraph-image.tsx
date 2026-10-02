import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { isLocale, type Locale } from "@/i18n/config";

export const alt = "Studio ATS — votre solution numérique";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const logoData = await readFile(join(process.cwd(), "public/brand/studio-mark-og.jpg"), "base64");
const logoSrc = `data:image/jpeg;base64,${logoData}`;

const taglines: Record<Locale, string> = {
  fr: "Votre solution numérique.",
  en: "Your digital solution.",
  nl: "Uw digitale oplossing.",
  es: "Tu solución digital.",
  de: "Ihre digitale Lösung.",
  pt: "Sua solução digital.",
  it: "La tua soluzione digitale.",
  ar: "حلّك الرقمي.",
  hi: "आपका डिजिटल समाधान।",
};

const scriptFonts: Partial<Record<Locale, string>> = {
  hi: "@fontsource/noto-sans-devanagari/files/noto-sans-devanagari-devanagari-400-normal.woff",
};

export default async function OpenGraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "fr";
  const fontFile = scriptFonts[locale];
  const font = (file: string) => readFile(join(process.cwd(), "node_modules", file));
  const fonts = fontFile ? [
    { name: "Noto Sans", data: await font("@fontsource/noto-sans/files/noto-sans-latin-400-normal.woff"), weight: 400 as const },
    { name: "Noto Sans", data: await font("@fontsource/noto-sans/files/noto-sans-latin-700-normal.woff"), weight: 700 as const },
    { name: "Script", data: await font(fontFile), weight: 400 as const },
  ] : undefined;
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", padding: 48, ...(fonts ? { fontFamily: "Noto Sans" } : {}), color: "#111225", background: "#f7f8fc" }}>
      <div style={{ position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", borderRadius: 36, padding: "66px 72px", background: "#ffffff", border: "1px solid #e5e7f1" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", alignSelf: "stretch", width: 610 }}>
          <div style={{ display: "flex", alignItems: "center", fontSize: 22, fontWeight: 700, letterSpacing: 4 }}>STUDIO <span style={{ color: "#2f5bff", padding: "0 9px" }}>▪</span> ATS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ fontSize: 68, lineHeight: 1, fontWeight: 700, letterSpacing: -3 }}>Studio ATS</div>
            <div style={{ fontSize: 34, lineHeight: 1.25, color: "#62667b", ...(fonts ? { fontFamily: "Script, Noto Sans" } : {}) }}>{taglines[locale === "ar" ? "en" : locale]}</div>
          </div>
          <div style={{ display: "flex", fontSize: 20, fontWeight: 600, color: "#68708f" }}>atonservice.org</div>
        </div>
        <div style={{ display: "flex", width: 420, height: 420, borderRadius: 40, overflow: "hidden", boxShadow: "0 30px 70px rgba(38, 72, 190, 0.22)" }}>
          <img src={logoSrc} width={420} height={420} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      </div>
    </div>,
    { ...size, fonts },
  );
}
