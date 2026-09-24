import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Noto_Sans_Arabic } from "next/font/google";
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

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  applicationName: "STUDIO",
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfbfd" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Runs before paint: applies the persisted theme choice (no flash).
const themeScript = `try{var t=localStorage.getItem('studio-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;

export default async function RootLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const fonts = `${geistSans.variable} ${geistMono.variable} ${locale === "ar" ? arabic.variable : ""}`;

  return (
    <html lang={locale} dir={localeMeta[locale].dir} className={fonts} data-scroll-behavior="smooth" suppressHydrationWarning>
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
