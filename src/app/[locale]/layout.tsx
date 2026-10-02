import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Noto_Sans_Arabic, Noto_Sans_Devanagari } from "next/font/google";
import { notFound } from "next/navigation";
import Script from "next/script";
import { locales, localeMeta, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n";
import { I18nProvider } from "@/components/providers";
import { env, isDemoMode } from "@/lib/env";
import { DemoBanner } from "@/components/ui/demo-banner";
import "../globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const arabic = Noto_Sans_Arabic({ variable: "--font-arabic", subsets: ["arabic"], preload: false });
const devanagari = Noto_Sans_Devanagari({ variable: "--font-devanagari", subsets: ["devanagari"], preload: false });

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  applicationName: "Studio ATS",
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#fbfbfd",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Runs before paint. New visitors always start in light mode; an explicit
// light, dark or system choice is still persisted and respected.
const themeScript = `try{var t=localStorage.getItem('studio-theme');document.documentElement.dataset.theme=t==='light'||t==='dark'||t==='system'?t:'light'}catch(e){document.documentElement.dataset.theme='light'}`;

export default async function RootLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const fonts = `${geistSans.variable} ${geistMono.variable} ${locale === "ar" ? arabic.variable : ""} ${locale === "hi" ? devanagari.variable : ""}`;

  return (
    <html lang={locale} dir={localeMeta[locale].dir} className={fonts} data-theme="light" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <Script id="studio-theme" strategy="beforeInteractive">{themeScript}</Script>
      </head>
      <body className="min-h-dvh">
        <I18nProvider locale={locale} dict={dict}>
          {isDemoMode && <DemoBanner text={dict.common.demoBanner} />}
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
